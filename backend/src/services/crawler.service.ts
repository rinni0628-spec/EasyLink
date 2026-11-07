import axios from "axios";
import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import { AppError } from "../types/index.js";

const CRAWL_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? 8000);
const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // guard against huge/streamed responses
const MAX_REDIRECTS = 5;

// Tags that never contain the kind of guidance text we want to show a user.
const NOISE_SELECTORS = [
  "script",
  "style",
  "nav",
  "footer",
  "header",
  "noscript",
  "iframe",
  "svg",
];

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "0.0.0.0"]);

// Below this, body text is too thin to build a guide from directly. Verified
// against a real NPS 공지사항 detail page whose entire content is an attached
// poster image: the surrounding board chrome alone (제목/작성부서/등록일/조회수
// /작성자/연락처 table, 첨부파일 안내, 이전글/다음글, 퀵메뉴 footer -- standard on
// most Korean government bulletin-board templates) measured 625 characters
// with zero actual guidance text, so the threshold has to clear that.
const IMAGE_FALLBACK_TEXT_THRESHOLD = 800;

// Filenames that are almost never the poster/notice itself.
const NON_CONTENT_IMAGE_PATTERN = /logo|icon|sprite|pixel|spacer|button|btn[-_.]/i;

// Korean government CMS boards commonly render an uploaded attachment/body
// image through a dynamic viewer endpoint rather than a static file path
// (e.g. NPS's /crosseditor/imageView.do?fileName=...). A src matching one of
// these is strong evidence of "this is the actual uploaded content", so it's
// preferred over other candidates found in document order.
const CMS_CONTENT_IMAGE_PATTERN = /imageview|filedown|download\.do|attach|upload|crosseditor|editor/i;

export interface CrawlResult {
  text: string;
  // A base64 data URI (data:image/...;base64,...), not a remote URL -- see
  // fetchImageAsDataUri below for why. The OpenAI-compatible image_url.url
  // field accepts either form, so this still drops straight into that shape.
  posterImageUrl?: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Blocks loopback/private/link-local ranges (incl. the 169.254.169.254 cloud
// metadata endpoint) so a user-supplied URL can't be used to reach internal
// network services (SSRF).
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    );
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fe80:")) return true; // link-local
    if (/^fe[c-f][0-9a-f]:/.test(normalized)) return true; // link-local variants
    if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // unique local (fc00::/7)
    if (normalized.startsWith("::ffff:")) {
      return isPrivateIp(normalized.slice("::ffff:".length));
    }
    return false;
  }
  return false;
}

// Resolves the hostname and rejects it if it (or anything it resolves to)
// points at an internal/private address. Call this before every request AND
// again on the final URL after redirects, since a redirect could otherwise
// be used to smuggle the request to an internal host.
async function assertPublicHost(hostname: string): Promise<void> {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new AppError("허용되지 않은 웹페이지 주소예요.", 400);
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new AppError("허용되지 않은 웹페이지 주소예요.", 400);
    }
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new AppError("웹사이트 주소를 찾을 수 없어요. 주소가 정확한지 확인해 주세요.", 502);
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new AppError("허용되지 않은 웹페이지 주소예요.", 400);
  }
}

// Best-effort pick of the plausible "this is the actual notice" image --
// nav/footer/header images are already gone by the time this runs
// (NOISE_SELECTORS stripped them), so this mostly filters out small
// decorative icons and obvious non-content filenames, then prefers a CMS
// content-viewer endpoint over a plain static asset path when both exist
// (a static site logo/icon can otherwise sort earlier in document order
// than the actual uploaded poster).
function findPosterImageUrl($: cheerio.CheerioAPI, pageUrl: string): string | undefined {
  const candidates: string[] = [];

  for (const el of $("img").toArray()) {
    const src = $(el).attr("src");
    if (!src || src.startsWith("data:")) continue;
    if (NON_CONTENT_IMAGE_PATTERN.test(src)) continue;

    const width = Number($(el).attr("width"));
    const height = Number($(el).attr("height"));
    if ((width > 0 && width < 200) || (height > 0 && height < 200)) continue;

    let absolute: string;
    try {
      absolute = new URL(src, pageUrl).toString();
    } catch {
      continue;
    }
    if (!isValidHttpUrl(absolute)) continue;

    candidates.push(absolute);
  }

  return candidates.find((src) => CMS_CONTENT_IMAGE_PATTERN.test(src)) ?? candidates[0];
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Handing OpenRouter a remote image URL asks the model provider to fetch it
// themselves, which turned out unreliable in testing: a free vision model
// either timed out at 120s or returned an empty completion against a real
// NPS poster image that our own server fetches in ~200ms. Downloading it
// here and embedding it as a base64 data URI removes that dependency --
// data URIs work with effectively every OpenAI-compatible vision model.
async function fetchImageAsDataUri(imageUrl: string): Promise<string | undefined> {
  try {
    await assertPublicHost(new URL(imageUrl).hostname);

    const response = await axios.get(imageUrl, {
      timeout: CRAWL_TIMEOUT_MS,
      responseType: "arraybuffer",
      maxRedirects: MAX_REDIRECTS,
      maxContentLength: MAX_IMAGE_BYTES,
      maxBodyLength: MAX_IMAGE_BYTES,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      validateStatus: (status) => status === 200,
    });

    const contentType = String(response.headers["content-type"] ?? "").split(";")[0].trim();
    const mimeType = contentType.startsWith("image/") ? contentType : "image/jpeg";
    const base64 = Buffer.from(response.data).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  } catch {
    // Best-effort: if the image can't be fetched, the caller falls back to
    // whatever sparse text was extracted rather than failing the request.
    return undefined;
  }
}

/**
 * Fetches a public-service page and extracts readable body text.
 * Distinguishes failure modes (invalid URL, blocked/CORS-like refusal,
 * timeout, not found) so the frontend can show a specific, senior-friendly
 * error message instead of a generic failure.
 */
export async function extractPageText(url: string): Promise<CrawlResult> {
  if (!isValidHttpUrl(url)) {
    throw new AppError("올바른 형식의 웹페이지 주소가 아닙니다.", 400);
  }

  await assertPublicHost(new URL(url).hostname);

  let html: string;
  // Tracks the post-redirect URL so relative <img src> values resolve
  // against the page that actually served them, not the original address.
  let resolvedUrl = url;
  try {
    const response = await axios.get<string>(url, {
      timeout: CRAWL_TIMEOUT_MS,
      responseType: "text",
      maxRedirects: MAX_REDIRECTS,
      maxContentLength: MAX_CONTENT_BYTES,
      maxBodyLength: MAX_CONTENT_BYTES,
      headers: {
        // Some public-service sites reject requests with no browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      validateStatus: (status) => status < 500,
    });

    // A redirect chain could otherwise be used to end up at an internal host
    // even though the original URL pointed at a public one.
    const finalUrl: string | undefined = (response.request as { res?: { responseUrl?: string } })
      ?.res?.responseUrl;
    if (finalUrl && finalUrl !== url) {
      await assertPublicHost(new URL(finalUrl).hostname);
      resolvedUrl = finalUrl;
    }

    if (response.status === 403 || response.status === 401) {
      throw new AppError(
        "해당 웹사이트가 자동 접속을 차단하고 있어요. 사이트 주소를 다시 확인해 주세요.",
        502,
      );
    }
    if (response.status === 404) {
      throw new AppError("페이지를 찾을 수 없어요. 주소가 정확한지 확인해 주세요.", 404);
    }
    if (response.status >= 400) {
      throw new AppError("웹페이지를 불러오는 중 문제가 발생했어요.", 502);
    }

    html = response.data;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new AppError(
          "웹페이지 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.",
          504,
        );
      }
      if (error.code === "ERR_FR_MAX_CONTENT_LENGTH_EXCEEDED") {
        throw new AppError("웹페이지 용량이 너무 커서 처리할 수 없어요.", 413);
      }
      if (error.code === "ERR_FR_TOO_MANY_REDIRECTS") {
        throw new AppError("웹페이지 이동(리다이렉트)이 너무 많아요. 주소를 다시 확인해 주세요.", 502);
      }
      // DNS failure, connection refused, TLS/CORS-style network rejection, etc.
      throw new AppError(
        "웹사이트에 접속할 수 없어요. 주소를 다시 확인해 주세요.",
        502,
      );
    }
    throw new AppError("웹페이지를 불러오는 중 알 수 없는 오류가 발생했어요.", 500);
  }

  const $ = cheerio.load(html);
  NOISE_SELECTORS.forEach((selector) => $(selector).remove());

  const text = $("body")
    .text()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const posterImageSrc =
    text.length < IMAGE_FALLBACK_TEXT_THRESHOLD ? findPosterImageUrl($, resolvedUrl) : undefined;
  const posterImageUrl = posterImageSrc ? await fetchImageAsDataUri(posterImageSrc) : undefined;

  if (text.length < 30 && !posterImageUrl) {
    throw new AppError(
      "이 페이지에서는 안내 내용을 찾지 못했어요. 다른 페이지 주소를 시도해 주세요.",
      422,
    );
  }

  // Keep the payload sent to the LLM bounded regardless of page size.
  return { text: text.slice(0, 8000), posterImageUrl };
}

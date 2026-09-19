import axios from "axios";
import * as cheerio from "cheerio";
import { AppError } from "../types/index.js";

const CRAWL_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? 8000);

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

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Fetches a public-service page and extracts readable body text.
 * Distinguishes failure modes (invalid URL, blocked/CORS-like refusal,
 * timeout, not found) so the frontend can show a specific, senior-friendly
 * error message instead of a generic failure.
 */
export async function extractPageText(url: string): Promise<string> {
  if (!isValidHttpUrl(url)) {
    throw new AppError("올바른 형식의 웹페이지 주소가 아닙니다.", 400);
  }

  let html: string;
  try {
    const response = await axios.get<string>(url, {
      timeout: CRAWL_TIMEOUT_MS,
      responseType: "text",
      headers: {
        // Some public-service sites reject requests with no browser-like UA.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      validateStatus: (status) => status < 500,
    });

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

  if (text.length < 30) {
    throw new AppError(
      "이 페이지에서는 안내 내용을 찾지 못했어요. 다른 페이지 주소를 시도해 주세요.",
      422,
    );
  }

  // Keep the payload sent to the LLM bounded regardless of page size.
  return text.slice(0, 8000);
}

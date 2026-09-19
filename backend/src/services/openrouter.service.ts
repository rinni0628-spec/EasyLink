import axios from "axios";
import { AppError, type GuideResponse, type GuideStep } from "../types/index.js";

const EXPECTED_STEP_COUNT = 3;

const OPENROUTER_URL =
  process.env.OPENROUTER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
// Free-tier models can queue behind paid traffic and reasoning models add
// latency before the first output token, so this default is higher than a
// typical paid-model timeout.
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 60000);

const SYSTEM_PROMPT = `You convert confusing public-service web page text into a guide for elderly Korean readers.

Grounding rule (avoid hallucination):
- Base the guide ONLY on facts present in the page text the user provides. Never invent phone numbers, fees, deadlines, office names, or steps that are not supported by the text.
- If the page text does not contain enough information for a step, say so plainly instead of guessing (e.g. "이 페이지에는 관련 내용이 없어요. 담당 기관에 직접 문의해 보세요.").

Language rule:
- Write in plain, everyday Korean a non-expert senior would understand. Avoid administrative/legal jargon; if a term must be kept (e.g. a form name), explain it in the same sentence.
- Avoid stiff, translated-sounding phrasing — write as a helpful person would explain it out loud.

Format rule (must be followed exactly):
- Structure the guide as exactly 3 sequential action steps (1단계, 2단계, 3단계), in the order the reader should perform them.
- Each step must be a concrete action the reader can do (e.g. "OO 웹사이트에서 신청서를 내려받으세요").
- Do not merge, split, reorder, or add steps beyond these 3.

Output rule (must be followed exactly):
- Respond with ONLY a single JSON object: no markdown code fences, no preamble or explanation, and no <think>/reasoning text before or after it.
- The response must start with "{" and end with "}".
- Match this exact shape: {"summary": string, "steps": [{"step": number, "title": string, "description": string}]}`;

function buildUserPrompt(sourceUrl: string, pageText: string): string {
  return `웹페이지 주소: ${sourceUrl}\n\n페이지 본문:\n"""\n${pageText}\n"""`;
}

function isValidStep(value: unknown): value is GuideStep {
  if (typeof value !== "object" || value === null) return false;
  const step = value as Record<string, unknown>;
  return (
    typeof step.step === "number" &&
    typeof step.title === "string" &&
    step.title.trim().length > 0 &&
    typeof step.description === "string" &&
    step.description.trim().length > 0
  );
}

function extractJsonObject(raw: string): string {
  // Models occasionally wrap JSON in ```json fences, or (reasoning models
  // especially) prepend/append stray commentary despite instructions not to.
  // Slicing to the outermost { ... } tolerates that without trusting the
  // whole string to be valid JSON.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return cleaned;
  return cleaned.slice(start, end + 1);
}

function parseModelJson(raw: string): Pick<GuideResponse, "summary" | "steps"> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(raw));
  } catch {
    throw new AppError("AI 응답을 해석하지 못했어요. 다시 시도해 주세요.", 502);
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new AppError("AI 응답 형식이 올바르지 않아요. 다시 시도해 주세요.", 502);
  }

  const { summary, steps } = parsed as Record<string, unknown>;

  if (typeof summary !== "string" || summary.trim().length === 0) {
    throw new AppError("AI 응답 형식이 올바르지 않아요. 다시 시도해 주세요.", 502);
  }

  if (
    !Array.isArray(steps) ||
    steps.length !== EXPECTED_STEP_COUNT ||
    !steps.every(isValidStep)
  ) {
    throw new AppError(
      "AI가 3단계 안내문을 올바르게 만들지 못했어요. 다시 시도해 주세요.",
      502,
    );
  }

  return { summary, steps };
}

// Free models are shared, best-effort capacity: transient "overloaded" or
// empty-completion responses are common (observed roughly 1 in 3 requests on
// the current default model) and usually clear up within a couple seconds,
// so it's worth a couple of quiet retries before surfacing an error.
const MAX_ATTEMPTS = 3;
const OVERLOAD_RETRY_DELAY_MS = 1500;

function isOverloaded(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 503;
}

// Free-tier providers occasionally return a fast 200 with no choices/content
// instead of a proper error status. Treated as retryable, same as a 503.
class EmptyCompletionError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGuide(
  sourceUrl: string,
  pageText: string,
): Promise<GuideResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError("서버에 AI 연동 설정이 되어 있지 않아요.", 500);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Node's axios `timeout` option resets on any socket activity, so a
    // provider that trickles keep-alive bytes while a slow free model "thinks"
    // can defeat it entirely. An AbortController deadline is a true wall-clock
    // cutoff regardless of what the connection is doing.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    try {
      const response = await axios.post(
        OPENROUTER_URL,
        {
          // Free-tier default; override via OPENROUTER_MODEL without a code
          // change if OpenRouter retires or rate-limits this model.
          model: process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(sourceUrl, pageText) },
          ],
          temperature: 0.3,
          // Keep chain-of-thought out of `content` for reasoning-capable
          // models so parseModelJson always sees a clean JSON object.
          reasoning: { exclude: true },
        },
        {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            // Recommended by OpenRouter for request attribution.
            "HTTP-Referer": "https://github.com/rinni0628-spec/EasyLink",
            "X-Title": "Easy-Link",
          },
        },
      );

      const content: string | undefined = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new EmptyCompletionError();
      }

      const { summary, steps } = parseModelJson(content);
      return { sourceUrl, summary, steps };
    } catch (error) {
      if (error instanceof AppError) throw error;

      if ((isOverloaded(error) || error instanceof EmptyCompletionError) && attempt < MAX_ATTEMPTS) {
        await sleep(OVERLOAD_RETRY_DELAY_MS);
        continue;
      }

      if (error instanceof EmptyCompletionError) {
        throw new AppError("AI로부터 응답을 받지 못했어요. 다시 시도해 주세요.", 502);
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
          throw new AppError(
            "AI 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.",
            504,
          );
        }
        if (error.response?.status === 401) {
          throw new AppError("AI 서비스 인증에 실패했어요.", 500);
        }
        if (error.response?.status === 429) {
          throw new AppError(
            "지금 요청이 몰려 있어요. 잠시 후 다시 시도해 주세요.",
            429,
          );
        }
        if (error.response?.status === 503) {
          throw new AppError(
            "무료 AI 모델에 이용자가 많아 지금은 연결이 어려워요. 잠시 후 다시 시도해 주세요.",
            503,
          );
        }
        throw new AppError("AI 안내문 생성 중 문제가 발생했어요.", 502);
      }
      throw new AppError("AI 안내문 생성 중 알 수 없는 오류가 발생했어요.", 500);
    } finally {
      clearTimeout(deadline);
    }
  }

  // Unreachable: every loop iteration either returns or throws.
  throw new AppError("AI 안내문 생성 중 알 수 없는 오류가 발생했어요.", 500);
}

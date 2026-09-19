import axios from "axios";
import { AppError, type GuideResponse } from "../types/index.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 20000);

const SYSTEM_PROMPT = `You convert confusing public-service web page text into a guide for elderly Korean readers.
Rules:
- Use plain, everyday Korean. Avoid administrative/legal jargon; explain any term you must keep.
- Structure the guide as exactly 3 sequential action steps (1단계, 2단계, 3단계).
- Each step must be something the reader can actually do (visit X, prepare document Y, click button Z).
- Respond with ONLY a JSON object, no markdown fences, matching this shape:
{"summary": string, "steps": [{"step": number, "title": string, "description": string}]}`;

function buildUserPrompt(sourceUrl: string, pageText: string): string {
  return `웹페이지 주소: ${sourceUrl}\n\n페이지 본문:\n"""\n${pageText}\n"""`;
}

function parseModelJson(raw: string): Pick<GuideResponse, "summary" | "steps"> {
  // Models occasionally wrap JSON in ```json fences despite instructions.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError("AI 응답을 해석하지 못했어요. 다시 시도해 주세요.", 502);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).summary !== "string" ||
    !Array.isArray((parsed as Record<string, unknown>).steps)
  ) {
    throw new AppError("AI 응답 형식이 올바르지 않아요. 다시 시도해 주세요.", 502);
  }

  return parsed as Pick<GuideResponse, "summary" | "steps">;
}

export async function generateGuide(
  sourceUrl: string,
  pageText: string,
): Promise<GuideResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError("서버에 AI 연동 설정이 되어 있지 않아요.", 500);
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: process.env.OPENROUTER_MODEL ?? "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(sourceUrl, pageText) },
        ],
        temperature: 0.3,
      },
      {
        timeout: OPENROUTER_TIMEOUT_MS,
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
      throw new AppError("AI로부터 응답을 받지 못했어요. 다시 시도해 주세요.", 502);
    }

    const { summary, steps } = parseModelJson(content);
    return { sourceUrl, summary, steps };
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
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
      throw new AppError("AI 안내문 생성 중 문제가 발생했어요.", 502);
    }
    throw new AppError("AI 안내문 생성 중 알 수 없는 오류가 발생했어요.", 500);
  }
}

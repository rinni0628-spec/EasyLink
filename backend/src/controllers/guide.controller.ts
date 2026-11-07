import type { NextFunction, Request, Response } from "express";
import { AppError, type FollowUpRequestBody, type GuideRequestBody } from "../types/index.js";
import { extractPageText } from "../services/crawler.service.js";
import { generateFollowUpAnswer, generateGuide } from "../services/openrouter.service.js";

export async function createGuide(
  req: Request<unknown, unknown, GuideRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { url } = req.body;
    if (!url) {
      throw new AppError("웹페이지 주소를 입력해 주세요.", 400);
    }

    // Vision (poster-image) support is wired up in crawler.service.ts and
    // openrouter.service.ts but currently disabled here: both free vision
    // models tried in testing failed reliably against a real poster page
    // (empty completions, 120s timeouts, then upstream 429s). Re-enable by
    // passing posterImageUrl through once a reliable model is picked.
    const { text: pageText } = await extractPageText(url);
    const guide = await generateGuide(url, pageText);

    res.status(200).json(guide);
  } catch (error) {
    next(error);
  }
}

// Follow-up Q&A has no server-side session, so it re-crawls `url` on every
// call instead of persisting the first request's extracted text.
export async function createFollowUpAnswer(
  req: Request<unknown, unknown, FollowUpRequestBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { url, question } = req.body;
    if (!url) {
      throw new AppError("웹페이지 주소를 입력해 주세요.", 400);
    }
    if (!question || !question.trim()) {
      throw new AppError("질문을 입력해 주세요.", 400);
    }

    const { text: pageText } = await extractPageText(url);
    const answer = await generateFollowUpAnswer(url, pageText, question.trim());

    res.status(200).json({ answer });
  } catch (error) {
    next(error);
  }
}

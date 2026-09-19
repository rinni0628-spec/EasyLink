import type { NextFunction, Request, Response } from "express";
import { AppError, type GuideRequestBody } from "../types/index.js";
import { extractPageText } from "../services/crawler.service.js";
import { generateGuide } from "../services/openrouter.service.js";

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

    const pageText = await extractPageText(url);
    const guide = await generateGuide(url, pageText);

    res.status(200).json(guide);
  } catch (error) {
    next(error);
  }
}

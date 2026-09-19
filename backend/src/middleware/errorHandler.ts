import type { NextFunction, Request, Response } from "express";
import { AppError } from "../types/index.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "서버에서 알 수 없는 오류가 발생했어요." });
}

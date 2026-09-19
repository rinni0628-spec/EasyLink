import { Router } from "express";
import { createGuide } from "../controllers/guide.controller.js";

export const guideRouter = Router();

guideRouter.post("/guide", createGuide);

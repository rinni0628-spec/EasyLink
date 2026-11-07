import { Router } from "express";
import { createFollowUpAnswer, createGuide } from "../controllers/guide.controller.js";

export const guideRouter = Router();

guideRouter.post("/guide", createGuide);
guideRouter.post("/guide/followup", createFollowUpAnswer);

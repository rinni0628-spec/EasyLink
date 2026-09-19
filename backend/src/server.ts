import "dotenv/config";
import cors from "cors";
import express from "express";
import { guideRouter } from "./routes/guide.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", guideRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Easy-Link backend listening on http://localhost:${PORT}`);
});

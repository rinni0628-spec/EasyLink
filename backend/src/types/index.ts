export interface GuideItem {
  icon: string;
  label: string;
  detail: string;
}

export interface GuideResponse {
  sourceUrl: string;
  headline: string;
  description: string;
  items: GuideItem[];
  // Structured echoes of facts already covered in prose within `items`,
  // extracted so the frontend can render purpose-built widgets (a countdown
  // badge, a tel: button, a checklist) instead of parsing free text. Each is
  // null/empty when the source text doesn't ground it -- never guessed.
  deadline: string | null; // ISO date "YYYY-MM-DD"
  amountKRW: number | null;
  // Short modifier phrase for amountKRW (e.g. "5년간 최대", "매달"). Always
  // null when amountKRW is null -- a condition with no backing number is
  // meaningless, so the two are kept in lockstep by the backend.
  amountCondition: string | null;
  phone: string | null;
  documents: string[];
}

export interface GuideRequestBody {
  url?: string;
}

// Re-crawls `url` and asks the AI a follow-up question about the same
// notice, grounded only in that fresh page text -- the server never persists
// the original extracted text, so a follow-up simply re-fetches it.
export interface FollowUpRequestBody {
  url?: string;
  question?: string;
}

export interface FollowUpResponse {
  answer: string;
}

// Thrown by services so errorHandler can map it to the right HTTP status.
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

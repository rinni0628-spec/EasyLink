export interface GuideStep {
  step: number;
  title: string;
  description: string;
}

export interface GuideResponse {
  sourceUrl: string;
  summary: string;
  steps: GuideStep[];
}

export interface GuideRequestBody {
  url?: string;
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

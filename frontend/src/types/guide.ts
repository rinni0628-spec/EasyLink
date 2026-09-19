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

export interface ApiErrorPayload {
  message: string;
}

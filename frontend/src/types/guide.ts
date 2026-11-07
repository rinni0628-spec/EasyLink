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
  // Structured echoes of facts already in `items`' prose -- see
  // backend/src/types/index.ts for the authoritative field docs. Optional so
  // a guide shape from before this field existed still satisfies the type.
  deadline?: string | null;
  amountKRW?: number | null;
  amountCondition?: string | null;
  phone?: string | null;
  documents?: string[];
}

export interface ApiErrorPayload {
  message: string;
}

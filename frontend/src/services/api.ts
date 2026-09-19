import type { ApiErrorPayload, GuideResponse } from "../types/guide";

export async function fetchGuide(url: string): Promise<GuideResponse> {
  const response = await fetch("/api/guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
    throw new Error(payload?.message ?? "안내문을 만드는 중 문제가 발생했어요.");
  }

  return (await response.json()) as GuideResponse;
}

import { useKakaoShare } from "../hooks/useKakaoShare";
import type { GuideResponse } from "../types/guide";

interface KakaoShareButtonProps {
  guide: GuideResponse;
}

function buildShareText(guide: GuideResponse): string {
  const stepLines = guide.steps.map((step) => `${step.step}단계. ${step.title}`).join("\n");
  return `[Easy-Link 쉬운 안내문]\n${guide.summary}\n\n${stepLines}`;
}

export function KakaoShareButton({ guide }: KakaoShareButtonProps) {
  const { isSupported, share } = useKakaoShare();

  if (!isSupported) {
    return (
      <p className="text-base text-ink/70">카카오톡 공유 기능을 사용할 수 없어요.</p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => share({ text: buildShareText(guide), url: guide.sourceUrl })}
      className="flex min-h-[56px] items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-5 py-3 text-lg font-bold text-[#191919] transition-colors hover:bg-[#f5dc00] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden="true">💬</span> 카카오톡 공유하기
    </button>
  );
}

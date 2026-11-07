import { useKakaoShare } from "../hooks/useKakaoShare";
import type { GuideResponse } from "../types/guide";

interface KakaoShareButtonProps {
  guide: GuideResponse;
}

function buildShareText(guide: GuideResponse): string {
  const itemLines = guide.items.map((item) => `${item.icon} ${item.label}: ${item.detail}`).join("\n");
  return `[Easy-Link 쉬운 안내문]\n${guide.headline}\n${guide.description}\n\n${itemLines}`;
}

export function KakaoShareButton({ guide }: KakaoShareButtonProps) {
  const { isSupported, share } = useKakaoShare();

  if (!isSupported) {
    return (
      <p className="text-base text-muted">카카오톡 공유 기능을 사용할 수 없어요.</p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => share({ text: buildShareText(guide), url: guide.sourceUrl })}
      className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-ink bg-[#FEE500] px-5 py-3 text-lg font-bold text-[#191919] shadow-sticker-sm transition-transform hover:bg-[#f5dc00] active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden="true">💬</span> 가족에게 공유하기
    </button>
  );
}

import { KakaoShareButton } from "../KakaoShareButton";
import type { GuideResponse } from "../../types/guide";

interface SuggestionButtonsProps {
  guide: GuideResponse;
  onAskFollowUp: () => void;
}

const buttonClass =
  "card-sticker flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-card px-4 py-3 text-lg font-bold text-ink transition-transform hover:bg-primary hover:text-paper active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";

// Next-step actions shown under a guide-result bubble. Each button only
// appears when its underlying data actually exists (e.g. no 전화로 문의하기
// button if the source text never grounded a phone number) rather than
// rendering a broken or empty action.
export function SuggestionButtons({ guide, onAskFollowUp }: SuggestionButtonsProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {guide.phone && (
        <a href={`tel:${guide.phone}`} className={buttonClass}>
          <span aria-hidden="true">📞</span> 전화로 문의하기
        </a>
      )}

      <a href={guide.sourceUrl} target="_blank" rel="noreferrer" className={buttonClass}>
        <span aria-hidden="true">🔗</span> 신청 사이트 바로가기
      </a>

      <button type="button" onClick={onAskFollowUp} className={buttonClass}>
        <span aria-hidden="true">💬</span> 더 궁금한 점 물어보기
      </button>

      <KakaoShareButton guide={guide} />

      <p className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-muted px-4 py-3 text-lg font-bold text-muted">
        <span aria-hidden="true">✅</span> 보관함에 저장됨
      </p>
    </div>
  );
}

import type { StarterAction } from "../../types/chat";

const STARTERS: { action: StarterAction; icon: string; label: string }[] = [
  { action: "paste-url", icon: "🔗", label: "안내문 주소 붙여넣기" },
  { action: "quick-links", icon: "⭐", label: "자주 찾는 서비스 보기" },
  { action: "help", icon: "❓", label: "사용 방법 알아보기" },
];

interface StarterButtonsProps {
  onSelect: (action: StarterAction) => void;
}

// Shown once under the welcome message so a first-time visitor has a large,
// unambiguous next step instead of facing a blank input field.
export function StarterButtons({ onSelect }: StarterButtonsProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {STARTERS.map((starter) => (
        <button
          key={starter.action}
          type="button"
          onClick={() => onSelect(starter.action)}
          className="card-sticker flex min-h-[56px] items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left text-lg font-bold text-ink transition-transform hover:bg-primary hover:text-paper active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {starter.icon}
          </span>
          {starter.label}
        </button>
      ))}
    </div>
  );
}

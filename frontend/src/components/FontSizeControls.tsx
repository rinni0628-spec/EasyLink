import { useFontScale } from "../hooks/useFontScale";

const buttonClass =
  "flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border-4 border-ink bg-card text-xl font-extrabold text-ink transition-transform hover:bg-ink hover:text-paper active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-ink disabled:active:scale-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function FontSizeControls() {
  const { increase, decrease, reset, canIncrease, canDecrease, isDefault } = useFontScale();

  return (
    <div role="group" aria-label="글자 크기 조절" className="flex items-center gap-2">
      <button type="button" onClick={decrease} disabled={!canDecrease} aria-label="글자 작게" className={buttonClass}>
        -
      </button>
      <button type="button" onClick={increase} disabled={!canIncrease} aria-label="글자 크게" className={buttonClass}>
        +
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={isDefault}
        className={`${buttonClass} min-w-0 px-4 text-base`}
      >
        초기화
      </button>
    </div>
  );
}

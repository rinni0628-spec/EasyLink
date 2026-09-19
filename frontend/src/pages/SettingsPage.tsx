import { FontSizeControls } from "../components/FontSizeControls";
import { useContrastMode } from "../hooks/useContrastMode";
import { useTtsRate } from "../hooks/useTtsRate";
import type { TtsRateOption } from "../hooks/useTtsRate";

const rateOptionClass = (active: boolean): string => {
  const base =
    "min-h-[56px] flex-1 rounded-lg border-4 px-4 py-3 text-lg font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
  return active ? `${base} border-primary bg-primary text-paper` : `${base} border-ink hover:bg-ink hover:text-paper`;
};

const RATE_OPTIONS: { value: TtsRateOption; label: string }[] = [
  { value: "normal", label: "보통 속도" },
  { value: "slow", label: "천천히" },
];

// Global, persisted controls for the three accessibility settings that apply
// across the whole app: text size, contrast, and TTS speech rate.
export function SettingsPage() {
  const contrast = useContrastMode();
  const ttsRate = useTtsRate();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-primary">화면 및 음성 설정</h1>
        <p className="mt-2 text-lg">보기 편한 화면과 듣기 편한 속도로 맞춰보세요.</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">글자 크기</h2>
        <FontSizeControls />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">고대비 모드</h2>
        <p className="text-lg leading-relaxed text-ink/70">
          화면의 글자와 배경 색상 차이를 최대로 키워서 더 또렷하게 보여줘요.
        </p>
        <button
          type="button"
          onClick={contrast.toggle}
          aria-pressed={contrast.isHighContrast}
          className="flex min-h-[56px] w-fit items-center justify-center rounded-lg border-4 border-ink px-6 py-3 text-lg font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {contrast.isHighContrast ? "고대비 모드 끄기" : "고대비 모드 켜기"}
        </button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-extrabold">음성 읽기 속도</h2>
        <div role="radiogroup" aria-label="음성 읽기 속도" className="flex gap-3">
          {RATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={ttsRate.option === option.value}
              onClick={() => ttsRate.setOption(option.value)}
              className={rateOptionClass(ttsRate.option === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

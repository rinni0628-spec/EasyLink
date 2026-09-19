import { forwardRef } from "react";
import type { GuideResponse } from "../types/guide";
import { TtsButton } from "./TtsButton";
import { KakaoShareButton } from "./KakaoShareButton";

interface GuideResultProps {
  guide: GuideResponse;
  onReset: () => void;
}

// forwardRef lets the page move focus here once the guide loads, so keyboard
// and screen-reader users land on the result instead of tabbing past the form.
export const GuideResult = forwardRef<HTMLElement, GuideResultProps>(function GuideResult(
  { guide, onReset },
  ref,
) {
  const fullText = [
    guide.summary,
    ...guide.steps.map((step) => `${step.step}단계. ${step.title}. ${step.description}`),
  ].join(" ");

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label="쉬운 안내문"
      className="flex flex-col gap-6 focus:outline-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="rounded-lg border-4 border-ink p-6">
        <h2 className="mb-2 text-xl font-extrabold">한눈에 보기</h2>
        <p className="text-lg leading-relaxed">{guide.summary}</p>
      </div>

      <ol className="flex flex-col gap-4">
        {guide.steps.map((step) => (
          <li key={step.step} className="rounded-lg border-4 border-primary p-6">
            <h3 className="mb-2 text-xl font-extrabold text-primary">
              {step.step}단계. {step.title}
            </h3>
            <p className="text-lg leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>

      <TtsButton text={fullText} />

      <div className="flex flex-col gap-4 sm:flex-row">
        <KakaoShareButton guide={guide} />
        <button
          type="button"
          onClick={onReset}
          className="flex min-h-[56px] flex-1 items-center justify-center rounded-lg bg-ink px-6 py-4 text-xl font-extrabold text-paper transition-colors hover:bg-ink/80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ← 처음으로
        </button>
      </div>
    </section>
  );
});

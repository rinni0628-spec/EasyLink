import type { GuideResponse } from "../types/guide";
import { TtsButton } from "./TtsButton";

interface GuideResultProps {
  guide: GuideResponse;
}

export function GuideResult({ guide }: GuideResultProps) {
  const fullText = [
    guide.summary,
    ...guide.steps.map((step) => `${step.step}단계. ${step.title}. ${step.description}`),
  ].join(" ");

  return (
    <section aria-label="쉬운 안내문" className="flex flex-col gap-6">
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
    </section>
  );
}

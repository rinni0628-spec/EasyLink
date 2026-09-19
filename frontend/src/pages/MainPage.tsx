import type { RefObject } from "react";
import { UrlInputForm } from "../components/UrlInputForm";
import { LoadingState } from "../components/LoadingState";
import { GuideResult } from "../components/GuideResult";
import type { GuideResponse } from "../types/guide";

interface MainPageProps {
  isLoading: boolean;
  error: string | null;
  guide: GuideResponse | null;
  onSubmit: (url: string) => void;
  onReset: () => void;
  resultRef: RefObject<HTMLElement>;
  errorId: string;
}

export function MainPage({ isLoading, error, guide, onSubmit, onReset, resultRef, errorId }: MainPageProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">쉬운 안내문 만들기</h1>
          <p className="mt-2 text-lg">복잡한 공공서비스 웹페이지를 쉬운 안내문으로 바꿔드려요.</p>
        </div>

        {guide && !isLoading && (
          <button
            type="button"
            onClick={onReset}
            className="flex min-h-[56px] shrink-0 items-center justify-center rounded-lg bg-ink px-6 py-4 text-xl font-extrabold text-paper transition-colors hover:bg-ink/80 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ← 처음으로
          </button>
        )}
      </header>

      {!guide && (
        <UrlInputForm isLoading={isLoading} onSubmit={onSubmit} hasError={error !== null} errorId={errorId} />
      )}

      {isLoading && <LoadingState />}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border-4 border-accent p-4 text-lg font-bold text-accent"
        >
          {error}
        </p>
      )}

      {guide && !isLoading && <GuideResult ref={resultRef} guide={guide} />}
    </main>
  );
}

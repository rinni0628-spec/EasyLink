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
      <header>
        <h1 className="text-2xl font-extrabold text-primary">쉬운 안내문 만들기</h1>
        <p className="mt-2 text-lg">복잡한 공공서비스 웹페이지를 쉬운 안내문으로 바꿔드려요.</p>
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

      {guide && !isLoading && <GuideResult ref={resultRef} guide={guide} onReset={onReset} />}
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { UrlInputForm } from "./components/UrlInputForm";
import { LoadingState } from "./components/LoadingState";
import { GuideResult } from "./components/GuideResult";
import { fetchGuide } from "./services/api";
import type { GuideResponse } from "./types/guide";

const ERROR_ID = "guide-error";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<GuideResponse | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  // Move focus to the result once it renders, so keyboard/screen-reader users
  // land on the guide instead of needing to tab past the whole form again.
  useEffect(() => {
    if (guide && !isLoading) {
      resultRef.current?.focus();
    }
  }, [guide, isLoading]);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    setError(null);
    setGuide(null);
    try {
      const result = await fetchGuide(url);
      setGuide(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-primary">Easy-Link</h1>
        <p className="mt-2 text-lg">복잡한 공공서비스 웹페이지를 쉬운 안내문으로 바꿔드려요.</p>
      </header>

      <UrlInputForm
        isLoading={isLoading}
        onSubmit={handleSubmit}
        hasError={error !== null}
        errorId={ERROR_ID}
      />

      {isLoading && <LoadingState />}

      {error && (
        <p
          id={ERROR_ID}
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

import { useState } from "react";
import type { FormEvent } from "react";

interface UrlInputFormProps {
  isLoading: boolean;
  onSubmit: (url: string) => void;
}

export function UrlInputForm({ isLoading, onSubmit }: UrlInputFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="url-input" className="text-lg font-bold">
        공공서비스 웹페이지 주소를 입력하세요
      </label>
      <input
        id="url-input"
        type="url"
        inputMode="url"
        required
        placeholder="예: https://www.gov.kr/..."
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        className="rounded-lg border-4 border-ink px-4 py-4 text-lg focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-primary px-6 py-4 text-xl font-bold text-paper transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
      >
        {isLoading ? "안내문을 만드는 중..." : "쉬운 안내문 만들기"}
      </button>
    </form>
  );
}

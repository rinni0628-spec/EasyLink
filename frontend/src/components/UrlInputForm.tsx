import { useState } from "react";
import type { FormEvent } from "react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  hasError: boolean;
  errorId: string;
}

// Browser default validation messages follow OS/browser locale, not the page's
// lang attribute — set a Korean message explicitly so senior users always see
// consistent guidance regardless of their device settings.
const URL_VALIDITY_MESSAGE = "올바른 웹사이트 주소를 입력해 주세요 (예: https://www.gov.kr/...)";

export function UrlInputForm({ onSubmit, hasError, errorId }: UrlInputFormProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="card-sticker flex flex-col gap-4 rounded-3xl p-6">
      <label htmlFor="url-input" className="text-lg font-bold text-ink">
        공공서비스 웹페이지 주소를 붙여넣으세요
      </label>
      <input
        id="url-input"
        type="url"
        inputMode="url"
        required
        placeholder="예: https://www.gov.kr/..."
        value={url}
        onChange={(event) => {
          event.currentTarget.setCustomValidity("");
          setUrl(event.target.value);
        }}
        onInvalid={(event) => event.currentTarget.setCustomValidity(URL_VALIDITY_MESSAGE)}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className="rounded-2xl border-4 border-ink bg-paper px-4 py-4 text-lg text-ink outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="flex min-h-[64px] items-center justify-center rounded-2xl border-4 border-ink bg-[#FFB347] px-6 py-4 text-lg font-black text-[#333333] shadow-sticker-sm transition-transform hover:bg-[#FFA733] active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        쉽게 요약하기
      </button>
    </form>
  );
}

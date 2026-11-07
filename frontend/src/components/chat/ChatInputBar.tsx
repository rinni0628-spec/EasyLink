import { forwardRef, useState } from "react";
import type { FormEvent } from "react";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled: boolean;
  isFollowUpMode: boolean;
}

// Fixed at the bottom of the chat (see MainPage.tsx's flex layout). One
// large text field plus one large, clearly-labeled send button -- no
// icon-only controls, per the accessibility rules.
export const ChatInputBar = forwardRef<HTMLInputElement, ChatInputBarProps>(function ChatInputBar(
  { onSend, disabled, isFollowUpMode },
  ref,
) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-shrink-0 items-end gap-3 border-t-4 border-ink bg-highlight p-4"
    >
      <label htmlFor="chat-input" className="sr-only">
        {isFollowUpMode ? "궁금한 점을 입력해주세요" : "안내문 주소나 메시지를 입력해주세요"}
      </label>
      <input
        id="chat-input"
        ref={ref}
        type="text"
        inputMode="url"
        autoComplete="off"
        placeholder={isFollowUpMode ? "궁금한 점을 입력해주세요" : "안내문 주소를 입력해주세요"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
        className="min-h-[56px] min-w-0 flex-1 rounded-2xl border-4 border-ink bg-paper px-4 py-3 text-lg text-ink outline-none focus:border-primary disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="flex min-h-[56px] flex-shrink-0 items-center justify-center gap-2 rounded-2xl border-4 border-ink bg-[#FFB347] px-5 py-3 text-lg font-black text-[#333333] shadow-sticker-sm transition-transform hover:bg-[#FFA733] active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        보내기
      </button>
    </form>
  );
});

import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface TtsButtonProps {
  text: string;
}

export function TtsButton({ text }: TtsButtonProps) {
  const { isSupported, isSpeaking, speak, stop } = useTextToSpeech();

  if (!isSupported) {
    return (
      <p className="text-base text-muted">
        이 브라우저에서는 음성 읽기 기능을 지원하지 않아요.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (isSpeaking ? stop() : speak(text))}
      aria-pressed={isSpeaking}
      className="flex min-h-[56px] w-full flex-1 flex-row items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-4 border-ink bg-card px-6 py-3 text-lg font-bold text-ink shadow-sticker-sm transition-transform hover:bg-primary hover:text-paper active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden="true">{isSpeaking ? "🔇" : "🔊"}</span>
      <span className="whitespace-nowrap">{isSpeaking ? "그만 듣기" : "소리로 듣기"}</span>
    </button>
  );
}

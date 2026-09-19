import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface TtsButtonProps {
  text: string;
}

export function TtsButton({ text }: TtsButtonProps) {
  const { isSupported, isSpeaking, speak, stop } = useTextToSpeech();

  if (!isSupported) {
    return (
      <p className="text-base text-ink/70">
        이 브라우저에서는 음성 읽기 기능을 지원하지 않아요.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (isSpeaking ? stop() : speak(text))}
      aria-pressed={isSpeaking}
      className="rounded-lg border-4 border-primary px-5 py-3 text-lg font-bold text-primary transition-colors hover:bg-primary hover:text-paper"
    >
      {isSpeaking ? "🔇 그만 듣기" : "🔊 소리로 듣기"}
    </button>
  );
}

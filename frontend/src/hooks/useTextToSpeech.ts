import { useCallback, useEffect, useState } from "react";

// SpeechSynthesis is not implemented in every browser (notably older ones);
// callers must check `isSupported` before rendering TTS controls.
export function useTextToSpeech() {
  const [isSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    },
    [isSupported],
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSupported, isSpeaking, speak, stop };
}

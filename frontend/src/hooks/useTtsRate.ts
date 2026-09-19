import { useEffect, useState } from "react";

const STORAGE_KEY = "easylink:tts-rate";

export type TtsRateOption = "slow" | "normal";

const RATE_VALUES: Record<TtsRateOption, number> = {
  slow: 0.7,
  normal: 1,
};

function readOption(): TtsRateOption {
  if (typeof window === "undefined") return "normal";
  return window.localStorage.getItem(STORAGE_KEY) === "slow" ? "slow" : "normal";
}

// Persists the reader's preferred speech rate (set from the Settings page)
// so every TtsButton across the app plays back at the same rate.
export function useTtsRate() {
  const [option, setOption] = useState<TtsRateOption>(() => readOption());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, option);
    } catch {
      // ignore -- storage may be disabled (private browsing)
    }
  }, [option]);

  return { option, setOption, rate: RATE_VALUES[option] };
}

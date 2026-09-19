import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "easylink:font-scale-step";
const BASE_FONT_PX = 18;
const STEP_PX = 2;
const MIN_STEP = -2;
const MAX_STEP = 5;

function readStep(): number {
  if (typeof window === "undefined") return 0;
  const parsed = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(parsed) ? Math.min(MAX_STEP, Math.max(MIN_STEP, parsed)) : 0;
}

// Lets seniors enlarge body text with one clear tap instead of finding
// browser zoom controls. Applied to the root font-size so every rem-based
// Tailwind size scales with it; persisted so the preference survives a reload.
export function useFontScale() {
  const [step, setStep] = useState<number>(() => readStep());

  useEffect(() => {
    document.documentElement.style.fontSize = `${BASE_FONT_PX + step * STEP_PX}px`;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(step));
    } catch {
      // ignore -- storage may be disabled (private browsing)
    }
  }, [step]);

  const increase = useCallback(() => setStep((s) => Math.min(MAX_STEP, s + 1)), []);
  const decrease = useCallback(() => setStep((s) => Math.max(MIN_STEP, s - 1)), []);
  const reset = useCallback(() => setStep(0), []);

  return {
    increase,
    decrease,
    reset,
    canIncrease: step < MAX_STEP,
    canDecrease: step > MIN_STEP,
    isDefault: step === 0,
  };
}

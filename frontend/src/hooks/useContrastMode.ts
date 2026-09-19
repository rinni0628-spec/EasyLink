import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "easylink:contrast-mode";

function readIsHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "high";
}

// Swaps the palette to a maximum-contrast black/yellow scheme via the
// `data-contrast` attribute on <html>. index.css maps that attribute to the
// CSS custom properties every Tailwind color utility resolves to (see
// tailwind.config.js), so no component needs to know contrast mode exists.
export function useContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => readIsHighContrast());

  useEffect(() => {
    document.documentElement.dataset.contrast = isHighContrast ? "high" : "normal";
    try {
      window.localStorage.setItem(STORAGE_KEY, isHighContrast ? "high" : "normal");
    } catch {
      // ignore -- storage may be disabled (private browsing)
    }
  }, [isHighContrast]);

  const toggle = useCallback(() => setIsHighContrast((value) => !value), []);

  return { isHighContrast, toggle };
}

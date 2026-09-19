import { useCallback, useEffect, useState } from "react";
import type { ArchiveItem } from "../types/archive";

const STORAGE_KEY = "easylink:policy-archive";
const MAX_ITEMS = 20;

function readArchive(): ArchiveItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Persists previously parsed pages so seniors can revisit a guide without
// retyping the URL. Stored per-browser in localStorage -- no backend involved.
export function usePolicyArchive() {
  const [items, setItems] = useState<ArchiveItem[]>(() => readArchive());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be full or disabled (private browsing); the archive
      // simply won't persist across reloads in that case.
    }
  }, [items]);

  const addItem = useCallback((url: string, title: string) => {
    setItems((prev) => {
      const withoutDuplicate = prev.filter((item) => item.url !== url);
      return [{ url, title, savedAt: new Date().toISOString() }, ...withoutDuplicate].slice(
        0,
        MAX_ITEMS,
      );
    });
  }, []);

  return { items, addItem };
}

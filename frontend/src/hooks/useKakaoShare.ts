import { useCallback, useEffect, useState } from "react";

// The Kakao SDK attaches itself to `window.Kakao` via the <script> tag in
// index.html rather than shipping as an npm module, so its shape is declared
// here instead of pulling in a types package for a handful of calls.
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

// Kakao's "text" feed template truncates beyond this length.
const MAX_SHARE_TEXT_LENGTH = 200;

interface ShareOptions {
  text: string;
  url: string;
}

// Guards every step that can silently fail: the SDK script not loaded yet,
// no JS key configured for this deployment, or Kakao rejecting the key.
// Callers should hide the share button when `isSupported` is false instead
// of letting a click do nothing.
export function useKakaoShare() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Kakao || !KAKAO_JS_KEY) {
      setIsSupported(false);
      return;
    }
    try {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      setIsSupported(window.Kakao.isInitialized());
    } catch {
      setIsSupported(false);
    }
  }, []);

  const share = useCallback(({ text, url }: ShareOptions) => {
    if (!window.Kakao) return;
    const truncated =
      text.length > MAX_SHARE_TEXT_LENGTH ? `${text.slice(0, MAX_SHARE_TEXT_LENGTH - 1)}…` : text;

    window.Kakao.Share.sendDefault({
      objectType: "text",
      text: truncated,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    });
  }, []);

  return { isSupported, share };
}

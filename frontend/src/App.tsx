import { useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MainPage } from "./pages/MainPage";
import { ArchivePage } from "./pages/ArchivePage";
import { SettingsPage } from "./pages/SettingsPage";
import { QuickLinksPage } from "./pages/QuickLinksPage";
import { HelpPage } from "./pages/HelpPage";
import { fetchFollowUpAnswer, fetchGuide } from "./services/api";
import { usePolicyArchive } from "./hooks/usePolicyArchive";
import { isLikelyUrl, normalizeUrl } from "./utils/url";
import { createId } from "./utils/id";
import type { ChatMessage, RetryAction, StarterAction } from "./types/chat";
import type { Page } from "./types/navigation";

const ARCHIVE_TITLE_MAX_LENGTH = 40;

function deriveArchiveTitle(headline: string): string {
  const trimmed = headline.trim();
  return trimmed.length > ARCHIVE_TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, ARCHIVE_TITLE_MAX_LENGTH)}…`
    : trimmed;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  kind: "welcome",
  text: "안녕하세요! 궁금한 안내문 주소를 보내주시면 쉽게 풀어서 알려드릴게요.",
};

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  // Set right after the reader taps "더 궁금한 점 물어보기" on a guide card --
  // the next non-URL message they send is routed to the follow-up endpoint
  // against this URL instead of being treated as an out-of-scope question.
  const [followUpUrl, setFollowUpUrl] = useState<string | null>(null);
  const { items: archiveItems, addItem: addArchiveItem } = usePolicyArchive();
  const inputRef = useRef<HTMLInputElement>(null);
  // A ref (not state) so the guard is synchronous: a fast double-tap on
  // "보내기" can otherwise fire two requests before React re-renders with
  // isLoading=true, letting two responses race and clobber each other.
  const isSubmittingRef = useRef(false);

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message]);
  }

  function replaceLoadingWith(message: ChatMessage) {
    setMessages((prev) => [...prev.filter((m) => m.kind !== "loading"), message]);
  }

  async function runGuideRequest(url: string) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    appendMessage({ id: createId(), role: "assistant", kind: "loading" });
    try {
      const guide = await fetchGuide(url);
      replaceLoadingWith({ id: createId(), role: "assistant", kind: "guide-result", guide });
      addArchiveItem(url, deriveArchiveTitle(guide.headline));
    } catch (err) {
      const text = err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.";
      replaceLoadingWith({
        id: createId(),
        role: "assistant",
        kind: "error",
        text,
        retry: { type: "guide", url },
      });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  async function runFollowUpRequest(sourceUrl: string, question: string) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    appendMessage({ id: createId(), role: "assistant", kind: "loading" });
    try {
      const answer = await fetchFollowUpAnswer(sourceUrl, question);
      replaceLoadingWith({ id: createId(), role: "assistant", kind: "followup-answer", text: answer });
    } catch (err) {
      const text = err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.";
      replaceLoadingWith({
        id: createId(),
        role: "assistant",
        kind: "error",
        text,
        retry: { type: "followup", sourceUrl, question },
      });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }

  function handleSend(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || isLoading) return;

    appendMessage({ id: createId(), role: "user", kind: "text", text: trimmed });

    if (isLikelyUrl(trimmed)) {
      setFollowUpUrl(null);
      void runGuideRequest(normalizeUrl(trimmed));
      return;
    }

    if (followUpUrl) {
      const url = followUpUrl;
      setFollowUpUrl(null);
      void runFollowUpRequest(url, trimmed);
      return;
    }

    appendMessage({
      id: createId(),
      role: "assistant",
      kind: "text",
      text: "공공서비스 웹페이지 주소를 입력해 주시면 쉬운 안내문으로 바꿔 드릴게요. 예: https://www.gov.kr/...",
    });
  }

  function handleRetry(messageId: string) {
    const target = messages.find((m) => m.id === messageId);
    if (!target || target.kind !== "error") return;
    const retry: RetryAction = target.retry;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (retry.type === "guide") {
      void runGuideRequest(retry.url);
    } else {
      void runFollowUpRequest(retry.sourceUrl, retry.question);
    }
  }

  function handleAskFollowUp(sourceUrl: string) {
    setFollowUpUrl(sourceUrl);
    appendMessage({
      id: createId(),
      role: "assistant",
      kind: "text",
      text: "어떤 점이 궁금하신가요? 아래 입력창에 적어주세요.",
    });
    inputRef.current?.focus();
  }

  function handleStarterSelect(action: StarterAction) {
    if (action === "paste-url") {
      inputRef.current?.focus();
      return;
    }
    if (action === "quick-links") {
      setPage("quick-links");
      return;
    }
    if (action === "help") {
      setPage("help");
    }
  }

  function submitUrlFromElsewhere(url: string) {
    setPage("main");
    setFollowUpUrl(null);
    appendMessage({ id: createId(), role: "user", kind: "text", text: url });
    void runGuideRequest(url);
  }

  function handleNavigate(nextPage: Page) {
    setPage(nextPage);
  }

  return (
    <div className="flex h-dvh justify-center bg-frame md:py-6">
      {/* Mobile app frame: full-bleed on phones, a centered "device" card on
          wider viewports so the layout always reads as a native app. */}
      <div className="flex h-full w-full max-w-md flex-col overflow-hidden bg-paper md:h-[calc(100vh-3rem)] md:rounded-3xl md:border-4 md:border-ink md:shadow-sticker">
        <TopBar currentPage={page} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {page === "main" ? (
            <MainPage
              messages={messages}
              isLoading={isLoading}
              isFollowUpMode={followUpUrl !== null}
              onSend={handleSend}
              onStarterSelect={handleStarterSelect}
              onRetry={handleRetry}
              onAskFollowUp={handleAskFollowUp}
              inputRef={inputRef}
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {page === "archive" && <ArchivePage items={archiveItems} onSelect={submitUrlFromElsewhere} />}
              {page === "settings" && <SettingsPage />}
              {page === "quick-links" && <QuickLinksPage onSelect={submitUrlFromElsewhere} />}
              {page === "help" && <HelpPage />}
            </div>
          )}
        </div>

        <Sidebar currentPage={page} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

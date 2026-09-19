import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MainPage } from "./pages/MainPage";
import { ArchivePage } from "./pages/ArchivePage";
import { SettingsPage } from "./pages/SettingsPage";
import { QuickLinksPage } from "./pages/QuickLinksPage";
import { HelpPage } from "./pages/HelpPage";
import { fetchGuide } from "./services/api";
import { usePolicyArchive } from "./hooks/usePolicyArchive";
import type { GuideResponse } from "./types/guide";
import type { Page } from "./types/navigation";

const ERROR_ID = "guide-error";
const ARCHIVE_TITLE_MAX_LENGTH = 40;

function deriveArchiveTitle(summary: string): string {
  const trimmed = summary.trim();
  return trimmed.length > ARCHIVE_TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, ARCHIVE_TITLE_MAX_LENGTH)}…`
    : trimmed;
}

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<GuideResponse | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const { items: archiveItems, addItem: addArchiveItem } = usePolicyArchive();

  // Move focus to the result once it renders, so keyboard/screen-reader users
  // land on the guide instead of needing to tab past the whole form again.
  useEffect(() => {
    if (guide && !isLoading && page === "main") {
      resultRef.current?.focus();
    }
  }, [guide, isLoading, page]);

  async function handleSubmit(url: string) {
    setIsLoading(true);
    setError(null);
    setGuide(null);
    try {
      const result = await fetchGuide(url);
      setGuide(result);
      addArchiveItem(url, deriveArchiveTitle(result.summary));
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleNavigate(nextPage: Page) {
    setPage(nextPage);
    setIsSidebarOpen(false);
  }

  function handleArchiveSelect(url: string) {
    setPage("main");
    setIsSidebarOpen(false);
    void handleSubmit(url);
  }

  function handleQuickLinkSelect(url: string) {
    setPage("main");
    void handleSubmit(url);
  }

  function handleReset() {
    setGuide(null);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <TopBar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((open) => !open)} />

      <Sidebar currentPage={page} isOpen={isSidebarOpen} onNavigate={handleNavigate} />

      <div className="flex-1">
        {page === "main" && (
          <MainPage
            isLoading={isLoading}
            error={error}
            guide={guide}
            onSubmit={handleSubmit}
            onReset={handleReset}
            resultRef={resultRef}
            errorId={ERROR_ID}
          />
        )}
        {page === "archive" && <ArchivePage items={archiveItems} onSelect={handleArchiveSelect} />}
        {page === "settings" && <SettingsPage />}
        {page === "quick-links" && <QuickLinksPage onSelect={handleQuickLinkSelect} />}
        {page === "help" && <HelpPage />}
      </div>
    </div>
  );
}

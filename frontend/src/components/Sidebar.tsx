import type { Page } from "../types/navigation";

interface SidebarProps {
  currentPage: Page;
  isOpen: boolean;
  onNavigate: (page: Page) => void;
}

function navItemClass(active: boolean): string {
  const base =
    "block min-h-[56px] w-full rounded-lg border-4 px-4 py-4 text-left text-lg font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
  return active
    ? `${base} border-primary bg-primary text-paper`
    : `${base} border-ink hover:bg-ink hover:text-paper`;
}

// Primary site navigation: every entry is a full-page route. Always visible
// on desktop; toggled by TopBar's "[메뉴]" button on mobile.
export function Sidebar({ currentPage, isOpen, onNavigate }: SidebarProps) {
  return (
    <aside
      id="main-sidebar"
      aria-label="주요 메뉴"
      className={`${isOpen ? "block" : "hidden"} w-full shrink-0 border-b-4 border-ink bg-gray-100 p-6 md:block md:min-h-screen md:w-72 md:border-b-0 md:border-r-4`}
    >
      <div className="mb-8 hidden md:block">
        <h1 className="text-2xl font-extrabold text-primary">Easy-Link</h1>
        <p className="mt-1 text-base text-ink/70">쉬운 공공서비스 안내</p>
      </div>

      <nav aria-label="페이지 이동" className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onNavigate("main")}
          aria-current={currentPage === "main" ? "page" : undefined}
          className={navItemClass(currentPage === "main")}
        >
          쉬운 안내문 만들기
        </button>
        <button
          type="button"
          onClick={() => onNavigate("archive")}
          aria-current={currentPage === "archive" ? "page" : undefined}
          className={navItemClass(currentPage === "archive")}
        >
          내 정책 보관소
        </button>
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          aria-current={currentPage === "settings" ? "page" : undefined}
          className={navItemClass(currentPage === "settings")}
        >
          화면 및 음성 설정
        </button>
      </nav>

      <div className="mt-8 flex flex-col gap-3 border-t-4 border-ink pt-6">
        <button
          type="button"
          onClick={() => onNavigate("quick-links")}
          aria-current={currentPage === "quick-links" ? "page" : undefined}
          className={navItemClass(currentPage === "quick-links")}
        >
          자주 찾는 공공서비스
        </button>
        <button
          type="button"
          onClick={() => onNavigate("help")}
          aria-current={currentPage === "help" ? "page" : undefined}
          className={navItemClass(currentPage === "help")}
        >
          서비스 이용 방법
        </button>
      </div>
    </aside>
  );
}

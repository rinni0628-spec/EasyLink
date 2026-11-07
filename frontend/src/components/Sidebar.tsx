import type { Page } from "../types/navigation";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; icon: string; label: string }[] = [
  { page: "main", icon: "✏️", label: "안내문 만들기" },
  { page: "archive", icon: "📁", label: "내 정책 보관소" },
  { page: "quick-links", icon: "⭐", label: "자주 찾는 서비스" },
  { page: "help", icon: "❓", label: "이용 방법" },
  { page: "settings", icon: "⚙️", label: "설정" },
];

// Primary site navigation, styled as a native-app bottom tab bar. Always
// visible -- every entry is a full-page route (see types/navigation.ts).
export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="flex flex-shrink-0 border-t-4 border-ink bg-highlight"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentPage === item.page;
        return (
          <button
            key={item.page}
            type="button"
            onClick={() => onNavigate(item.page)}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-accent ${
              isActive ? "text-primary" : "text-ink/60"
            }`}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {item.icon}
            </span>
            <span className="px-0.5 text-center text-xs font-bold leading-tight">{item.label}</span>
            {isActive && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
}

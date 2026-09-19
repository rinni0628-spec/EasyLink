interface TopBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Mobile-only header. Per project a11y guidance, the sidebar toggle is a
// plain text button ("[메뉴]") instead of a hamburger icon, since an icon-only
// control can be ambiguous for senior users unfamiliar with the convention.
export function TopBar({ isSidebarOpen, onToggleSidebar }: TopBarProps) {
  return (
    <div className="flex items-center justify-between border-b-4 border-ink bg-gray-100 px-6 py-4 md:hidden">
      <span className="text-xl font-extrabold text-primary">Easy-Link</span>
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-expanded={isSidebarOpen}
        aria-controls="main-sidebar"
        className="rounded-lg border-4 border-ink px-5 py-3 text-lg font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {isSidebarOpen ? "[메뉴 닫기]" : "[메뉴]"}
      </button>
    </div>
  );
}

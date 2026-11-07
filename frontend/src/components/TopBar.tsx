import type { Page } from "../types/navigation";

interface TopBarProps {
  currentPage: Page;
}

const PAGE_LABEL: Record<Page, string> = {
  main: "쉬운 안내문 만들기",
  archive: "내 정책 보관소",
  "quick-links": "자주 찾는 공공서비스",
  help: "서비스 이용 방법",
  settings: "화면 및 음성 설정",
};

// App "status bar": brand mark plus the current screen's title, mirroring a
// native app header. Navigation itself lives entirely in the bottom tab bar.
export function TopBar({ currentPage }: TopBarProps) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b-4 border-ink bg-highlight px-5 py-3">
      <span className="text-xl font-black text-ink">Easy-Link</span>
      <span className="text-sm font-bold text-muted">{PAGE_LABEL[currentPage]}</span>
    </div>
  );
}

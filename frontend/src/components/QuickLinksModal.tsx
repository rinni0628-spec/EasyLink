import { Modal } from "./Modal";

interface QuickLink {
  name: string;
  url: string;
}

const QUICK_LINKS: QuickLink[] = [
  { name: "정부24", url: "https://www.gov.kr" },
  { name: "복지로", url: "https://www.bokjiro.go.kr" },
  { name: "국민건강보험", url: "https://www.nhis.or.kr" },
  { name: "국민연금공단", url: "https://www.nps.or.kr" },
];

interface QuickLinksModalProps {
  onClose: () => void;
  onSelect: (url: string) => void;
}

// Lets seniors skip typing a URL entirely for the institutions they visit
// most. Selecting one closes the modal and hands the URL up to App, which
// switches to the Main Page and submits it automatically.
export function QuickLinksModal({ onClose, onSelect }: QuickLinksModalProps) {
  return (
    <Modal titleId="quick-links-title" title="자주 찾는 공공서비스" onClose={onClose}>
      <p className="text-lg leading-relaxed">
        아래 기관을 누르면 바로 쉬운 안내문을 만들어 드려요.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            type="button"
            onClick={() => onSelect(link.url)}
            className="flex min-h-[64px] items-center justify-center rounded-lg border-4 border-primary px-4 py-4 text-xl font-extrabold text-primary transition-colors hover:bg-primary hover:text-paper focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {link.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}

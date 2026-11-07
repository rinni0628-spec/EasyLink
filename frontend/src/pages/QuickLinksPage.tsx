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

interface QuickLinksPageProps {
  onSelect: (url: string) => void;
}

// Lets seniors skip typing a URL entirely for the institutions they visit
// most. Selecting one switches to the Main Page and submits the URL automatically.
export function QuickLinksPage({ onSelect }: QuickLinksPageProps) {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="card-sticker rounded-3xl bg-highlight px-6 py-6 text-center">
        <h1 className="text-2xl font-black text-ink">자주 찾는 공공서비스</h1>
        <p className="mt-2 text-lg text-muted">아래 기관을 누르면 바로 쉬운 안내문을 만들어 드려요.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.url}
            type="button"
            onClick={() => onSelect(link.url)}
            className="card-sticker flex min-h-[80px] items-center justify-center rounded-2xl px-4 py-4 text-center text-xl font-extrabold text-ink transition-transform hover:bg-primary hover:text-paper active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {link.name}
          </button>
        ))}
      </div>
    </main>
  );
}

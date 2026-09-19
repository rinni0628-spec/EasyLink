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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-primary">자주 찾는 공공서비스</h1>
        <p className="mt-2 text-lg">아래 기관을 누르면 바로 쉬운 안내문을 만들어 드려요.</p>
      </header>

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
    </main>
  );
}

import type { ArchiveItem } from "../types/archive";

interface ArchivePageProps {
  items: ArchiveItem[];
  onSelect: (url: string) => void;
}

function formatSavedAt(savedAt: string): string {
  try {
    return new Date(savedAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return savedAt;
  }
}

// Full-page history of parsed URLs, read from localStorage via
// usePolicyArchive. Selecting an entry re-submits its URL from the Main Page.
export function ArchivePage({ items, onSelect }: ArchivePageProps) {
  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="card-sticker rounded-3xl bg-highlight px-6 py-6 text-center">
        <h1 className="text-2xl font-black text-ink">내 정책 보관소</h1>
        <p className="mt-2 text-lg text-muted">전에 만들었던 쉬운 안내문을 다시 볼 수 있어요.</p>
      </header>

      {items.length === 0 ? (
        <div className="card-sticker flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
          <span aria-hidden="true" className="text-6xl opacity-30">
            📁
          </span>
          <p className="text-lg font-medium leading-relaxed text-muted">
            아직 저장된 안내문이 없어요.
            <br />
            "쉬운 안내문 만들기"에서 주소를 입력하면 이곳에 자동으로 쌓여요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.url}>
              <button
                type="button"
                onClick={() => onSelect(item.url)}
                className="card-sticker block w-full rounded-2xl p-5 text-left transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="block text-lg font-bold leading-snug text-ink">{item.title}</span>
                <span className="mt-1 block truncate text-base text-muted">{item.url}</span>
                <span className="mt-1 block text-base text-muted">{formatSavedAt(item.savedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

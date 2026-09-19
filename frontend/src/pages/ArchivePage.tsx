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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-primary">내 정책 보관소</h1>
        <p className="mt-2 text-lg">전에 만들었던 쉬운 안내문을 다시 볼 수 있어요.</p>
      </header>

      {items.length === 0 ? (
        <p className="text-lg leading-relaxed text-ink/70">
          아직 저장된 안내문이 없어요.
          <br />
          "쉬운 안내문 만들기"에서 주소를 입력하면 이곳에 자동으로 쌓여요.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.url}>
              <button
                type="button"
                onClick={() => onSelect(item.url)}
                className="block w-full rounded-lg border-4 border-ink p-5 text-left transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="block text-lg font-bold leading-snug text-primary">{item.title}</span>
                <span className="mt-1 block truncate text-base text-ink/60">{item.url}</span>
                <span className="mt-1 block text-base text-ink/60">{formatSavedAt(item.savedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

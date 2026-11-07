import { useState } from "react";
import type { GuideItem, GuideResponse } from "../types/guide";
import { TtsButton } from "./TtsButton";

interface GuideResultProps {
  guide: GuideResponse;
}

// Mirrors backend/src/services/openrouter.service.ts's LABEL_ORDER. Kept as
// a defensive re-sort here too (cheap) in case a cached/older response ever
// arrives out of order -- the backend is the source of truth for ordering.
const LABEL_ORDER = ["지원 대상", "지원 금액", "신청 방법", "알아둘 점", "주의사항", "문의처"] as const;

// Per-label card tint, defined in index.css / tailwind.config.js. Collapses
// to a single card color under the 고대비 palette (see index.css), so this
// mapping only visibly matters in normal-contrast mode.
const LABEL_STYLES: Record<string, string> = {
  "지원 대상": "bg-label-target",
  "지원 금액": "bg-label-amount",
  "신청 방법": "bg-label-apply",
  "알아둘 점": "bg-label-note",
  "주의사항": "bg-label-caution",
  "문의처": "bg-label-contact",
};

function sortItemsByLabelOrder(items: GuideItem[]): GuideItem[] {
  return [...items].sort(
    (a, b) =>
      LABEL_ORDER.indexOf(a.label as (typeof LABEL_ORDER)[number]) -
      LABEL_ORDER.indexOf(b.label as (typeof LABEL_ORDER)[number]),
  );
}

// The backend's merge/fallback rules can fold a fact into an item whose icon
// doesn't match it (e.g. "bring your ID card" often ends up inside the ✅
// 신청 방법 sentence rather than its own 📄 item), so a structured field's
// widget can't always assume it belongs on the item with the "obvious" icon.
// Tries the expected icon first, then falls back to the label the Format
// rule says that kind of fact usually gets merged into.
function findWidgetItem(
  items: GuideItem[],
  icon: string,
  fallbackLabels: readonly string[],
): GuideItem | undefined {
  const byIcon = items.find((item) => item.icon === icon);
  if (byIcon) return byIcon;
  for (const label of fallbackLabels) {
    const byLabel = items.find((item) => item.label === label);
    if (byLabel) return byLabel;
  }
  return undefined;
}

// 340000 -> "34만 원"; 345000 -> "34.5만 원"; 8000 -> "8,000원" (amounts under
// 1만 원 read oddly in 만원 units, so those stay in plain 원).
function toManwon(amountKRW: number): string {
  if (amountKRW < 10000) return `${amountKRW.toLocaleString("ko-KR")}원`;
  const manwon = Math.round((amountKRW / 10000) * 10) / 10;
  return `${Number.isInteger(manwon) ? manwon : manwon.toFixed(1)}만 원`;
}

// Calendar-day difference, ignoring time-of-day, so "today" doesn't flip to
// -1 a few hours early depending on when in the day the reader opens this.
function daysUntil(deadline: string): number {
  const [y, m, d] = deadline.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

// Short badge text for the top of the card -- plain Korean ("20일 남음")
// rather than the jargony "D-20" convention, since the fuller sentence
// version (formatDeadline below) already lives inside the 📅 item.
function formatDDayBadge(deadline: string): string {
  const remaining = daysUntil(deadline);
  if (remaining < 0) return "마감됨";
  if (remaining === 0) return "오늘 마감";
  return `${remaining}일 남음`;
}

// "10월 31일(토)까지 · 20일 남았어요" / "...오늘까지예요" / "마감됐어요".
function formatDeadline(deadline: string): string {
  const [y, m, d] = deadline.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const remaining = daysUntil(deadline);
  // Intl inserts a space before the weekday parenthesis ("10월 31일 (토)");
  // dropped to match the senior-friendly "10월 31일(토)" spacing this app uses.
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
    .format(target)
    .replace(" (", "(");

  if (remaining < 0) return "마감됐어요";
  if (remaining === 0) return `${dateLabel} · 오늘까지예요`;
  return `${dateLabel}까지 · ${remaining}일 남았어요`;
}

// The icon glyph (💰📅👤...) is a visual-only cue. Screen readers and the
// TTS button must never announce it — including it tends to read as a
// garbled emoji name ("money bag emoji") instead of anything useful, so
// every consumer of guide text builds sentences from label/detail only.
function toSpokenText(guide: GuideResponse): string {
  const sentences = [
    guide.headline,
    guide.description,
    ...guide.items.map((item) => `${item.label}. ${item.detail}`),
  ];
  // The model has no notion of "today", so the remaining-days countdown is
  // new information the TTS reading would otherwise miss entirely.
  if (guide.deadline) {
    sentences.push(`마감일은 ${formatDeadline(guide.deadline)}.`);
  }
  return sentences.join(" ");
}

// Local checkbox list for "문서 챙기기" -- purely a visual tick-off aid for
// the reader while they pack; nothing here is persisted or submitted.
function DocumentsChecklist({ documents }: { documents: string[] }) {
  const [checkedIndexes, setCheckedIndexes] = useState<Set<number>>(() => new Set());

  function toggle(index: number) {
    setCheckedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="mt-2 rounded-xl border-2 border-ink bg-paper p-3">
      <p className="mb-2 text-base font-extrabold text-ink">챙길 것</p>
      <ul className="flex flex-col gap-1">
        {documents.map((document, index) => {
          const isChecked = checkedIndexes.has(index);
          return (
            <li key={document}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-lg text-ink">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(index)}
                  className="h-6 w-6 flex-shrink-0 accent-primary"
                />
                <span className={isChecked ? "text-muted line-through" : ""}>{document}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GuideResult({ guide }: GuideResultProps) {
  const spokenText = toSpokenText(guide);
  const items = sortItemsByLabelOrder(guide.items);

  const deadlineItem = guide.deadline ? findWidgetItem(items, "📅", ["알아둘 점", "신청 방법"]) : undefined;
  const amountItem = guide.amountKRW != null ? findWidgetItem(items, "💰", ["지원 금액"]) : undefined;
  const phoneItem = guide.phone ? findWidgetItem(items, "📞", ["문의처", "신청 방법"]) : undefined;
  const documentsItem =
    guide.documents && guide.documents.length > 0
      ? findWidgetItem(items, "📄", ["신청 방법"])
      : undefined;

  return (
    <section aria-label="쉬운 안내문" className="flex flex-col gap-4">
      <div className="card-sticker rounded-3xl bg-highlight p-6">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-xl font-black text-ink">한눈에 보기</h2>
          {guide.deadline && (
            <span className="card-sticker flex-shrink-0 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-base font-black text-paper">
              ⏰ {formatDDayBadge(guide.deadline)}
            </span>
          )}
        </div>
        <p className="mb-1 text-lg font-bold leading-snug text-ink">{guide.headline}</p>
        <p className="mb-4 text-base leading-relaxed text-muted">{guide.description}</p>

        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={index}
              className={`card-sticker rounded-2xl p-3 ${LABEL_STYLES[item.label] ?? "bg-card"}`}
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 flex-shrink-0 text-2xl leading-none">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-extrabold text-ink">{item.label}</p>
                  <p className="text-lg leading-snug text-ink">{item.detail}</p>

                  {item === deadlineItem && guide.deadline && (
                    <p className="mt-1 text-base font-bold text-primary-dark">
                      ⏰ {formatDeadline(guide.deadline)}
                    </p>
                  )}

                  {item === amountItem && guide.amountKRW != null && (
                    <p className="mt-1 text-xl font-black text-primary-dark">
                      {guide.amountCondition ? `${guide.amountCondition} ` : ""}
                      {toManwon(guide.amountKRW)}
                    </p>
                  )}

                  {item === phoneItem && guide.phone && (
                    <a
                      href={`tel:${guide.phone}`}
                      className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-4 border-ink bg-primary px-4 py-2 text-lg font-extrabold text-paper transition-transform active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      📞 전화 걸기 ({guide.phone})
                    </a>
                  )}

                  {item === documentsItem && guide.documents && guide.documents.length > 0 && (
                    <DocumentsChecklist documents={guide.documents} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <TtsButton text={spokenText} />
    </section>
  );
}

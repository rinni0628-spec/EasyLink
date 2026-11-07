import type { ReactNode } from "react";

interface AssistantBubbleProps {
  children: ReactNode;
  // Guide-result cards already render their own card-sticker frame (see
  // GuideResult.tsx), so wrapping them in a second bubble would double up
  // the thick border/shadow -- this skips the bubble chrome and just adds
  // the avatar alongside the card itself.
  bare?: boolean;
}

// Small round avatar so assistant messages read as "from Easy-Link" at a
// glance, matching the reference screenshot's avatar-plus-bubble layout.
function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-4 border-ink bg-highlight text-lg font-black text-ink"
    >
      EL
    </span>
  );
}

export function AssistantBubble({ children, bare = false }: AssistantBubbleProps) {
  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="min-w-0 max-w-[85%] flex-1">
        {bare ? (
          children
        ) : (
          <div className="card-sticker break-words rounded-2xl rounded-tl-sm bg-card px-4 py-3">{children}</div>
        )}
      </div>
    </div>
  );
}

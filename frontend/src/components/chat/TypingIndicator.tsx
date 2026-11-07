import { AssistantBubble } from "./AssistantBubble";

// The AI call can take up to 120 seconds (see backend OPENROUTER_TIMEOUT_MS),
// so this pairs the dot animation with an explicit reassurance that nothing
// is broken -- a bare spinner reads as "stuck" after a few seconds on a wait
// this long.
export function TypingIndicator() {
  return (
    <AssistantBubble>
      <div role="status" className="flex items-center gap-3">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink" />
        </span>
        <p className="text-lg font-bold text-ink">안내문을 읽고 있어요. 잠시만 기다려 주세요.</p>
      </div>
    </AssistantBubble>
  );
}

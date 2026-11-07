import { useEffect, useRef } from "react";
import type { ChatMessage, StarterAction } from "../../types/chat";
import { AssistantBubble } from "./AssistantBubble";
import { UserBubble } from "./UserBubble";
import { TypingIndicator } from "./TypingIndicator";
import { StarterButtons } from "./StarterButtons";
import { SuggestionButtons } from "./SuggestionButtons";
import { GuideResult } from "../GuideResult";

interface ChatMessageListProps {
  messages: ChatMessage[];
  onStarterSelect: (action: StarterAction) => void;
  onRetry: (messageId: string) => void;
  onAskFollowUp: (sourceUrl: string) => void;
}

export function ChatMessageList({ messages, onStarterSelect, onRetry, onAskFollowUp }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever the conversation grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div aria-live="polite" className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => {
        switch (message.kind) {
          case "welcome":
            return (
              <AssistantBubble key={message.id}>
                <p className="text-lg leading-relaxed text-ink">{message.text}</p>
                <StarterButtons onSelect={onStarterSelect} />
              </AssistantBubble>
            );

          case "text":
            return message.role === "user" ? (
              <UserBubble key={message.id} text={message.text} />
            ) : (
              <AssistantBubble key={message.id}>
                <p className="text-lg leading-relaxed text-ink">{message.text}</p>
              </AssistantBubble>
            );

          case "loading":
            return <TypingIndicator key={message.id} />;

          case "error":
            return (
              <AssistantBubble key={message.id}>
                <p role="alert" className="text-lg font-bold leading-relaxed text-accent">
                  {message.text}
                </p>
                <button
                  type="button"
                  onClick={() => onRetry(message.id)}
                  className="card-sticker mt-3 flex min-h-[48px] items-center justify-center rounded-2xl bg-card px-5 py-2 text-lg font-bold text-ink transition-transform hover:bg-primary hover:text-paper active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  🔄 다시 시도
                </button>
              </AssistantBubble>
            );

          case "guide-result":
            return (
              <AssistantBubble key={message.id} bare>
                <GuideResult guide={message.guide} />
                <SuggestionButtons guide={message.guide} onAskFollowUp={() => onAskFollowUp(message.guide.sourceUrl)} />
              </AssistantBubble>
            );

          case "followup-answer":
            return (
              <AssistantBubble key={message.id}>
                <p className="text-lg leading-relaxed text-ink">{message.text}</p>
              </AssistantBubble>
            );

          default:
            return null;
        }
      })}
      <div ref={bottomRef} />
    </div>
  );
}

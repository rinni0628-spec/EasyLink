import type { RefObject } from "react";
import { ChatMessageList } from "../components/chat/ChatMessageList";
import { ChatInputBar } from "../components/chat/ChatInputBar";
import type { ChatMessage, StarterAction } from "../types/chat";

interface MainPageProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isFollowUpMode: boolean;
  onSend: (text: string) => void;
  onStarterSelect: (action: StarterAction) => void;
  onRetry: (messageId: string) => void;
  onAskFollowUp: (sourceUrl: string) => void;
  inputRef: RefObject<HTMLInputElement>;
}

export function MainPage({
  messages,
  isLoading,
  isFollowUpMode,
  onSend,
  onStarterSelect,
  onRetry,
  onAskFollowUp,
  inputRef,
}: MainPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatMessageList
        messages={messages}
        onStarterSelect={onStarterSelect}
        onRetry={onRetry}
        onAskFollowUp={onAskFollowUp}
      />
      <ChatInputBar ref={inputRef} onSend={onSend} disabled={isLoading} isFollowUpMode={isFollowUpMode} />
    </div>
  );
}

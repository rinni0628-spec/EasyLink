import type { GuideResponse } from "./guide";

// What a "다시 시도" button on an error bubble should re-run -- carries
// whatever the failed request needs so handleRetry can replay it exactly,
// without re-appending a duplicate user message.
export type RetryAction =
  | { type: "guide"; url: string }
  | { type: "followup"; sourceUrl: string; question: string };

export type StarterAction = "paste-url" | "quick-links" | "help";

interface BaseMessage {
  id: string;
}

export interface WelcomeMessage extends BaseMessage {
  role: "assistant";
  kind: "welcome";
  text: string;
}

export interface AssistantTextMessage extends BaseMessage {
  role: "assistant";
  kind: "text";
  text: string;
}

export interface UserTextMessage extends BaseMessage {
  role: "user";
  kind: "text";
  text: string;
}

export interface LoadingMessage extends BaseMessage {
  role: "assistant";
  kind: "loading";
}

export interface ErrorMessage extends BaseMessage {
  role: "assistant";
  kind: "error";
  text: string;
  retry: RetryAction;
}

export interface GuideResultMessage extends BaseMessage {
  role: "assistant";
  kind: "guide-result";
  guide: GuideResponse;
}

export interface FollowUpAnswerMessage extends BaseMessage {
  role: "assistant";
  kind: "followup-answer";
  text: string;
}

export type ChatMessage =
  | WelcomeMessage
  | AssistantTextMessage
  | UserTextMessage
  | LoadingMessage
  | ErrorMessage
  | GuideResultMessage
  | FollowUpAnswerMessage;

"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat.type";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmptyAssistant = !isUser && message.content.length === 0;

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-sidebar-primary text-sidebar-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {isEmptyAssistant ? (
          // Streaming placeholder so the in-progress bubble is visible immediately.
          <span className="inline-block h-4 w-2 animate-pulse rounded-sm bg-foreground/40 align-middle" />
        ) : (
          <p className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}

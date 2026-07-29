"use client";

import { useEffect, useRef } from "react";
import { ChatMessageBubble } from "./chat-message-bubble";
import type { ChatMessage } from "@/types/chat.type";

interface ChatThreadProps {
  messages: ChatMessage[];
  isSessionPending: boolean;
}

export function ChatThread({ messages , isSessionPending}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message, including streamed AI responses.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isSessionPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="flex w-full justify-end">
          <div className="max-w-[85%] animate-pulse rounded-2xl rounded-br-sm bg-sidebar-primary/60 px-4 py-2.5" />
        </div>
        <div className="flex w-full justify-start">
          <div className="max-w-[85%] animate-pulse rounded-2xl rounded-bl-sm bg-muted/80 px-4 py-2.5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

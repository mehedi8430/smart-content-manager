"use client";

import { useEffect, useRef } from "react";
import { ChatMessageBubble } from "./chat-message-bubble";
import { useChat } from "@/providers/chat-provider";
import type { ChatMessage } from "@/types/chat.type";

interface ChatThreadProps {
  messages: ChatMessage[];
}

export function ChatThread({ messages }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the newest message as tokens stream in. Mirrors the content
  // generator's live-render pattern: keep the latest content in view without
  // reimplementing a scroll library — a bottom anchor scrolled into view on
  // every messages change handles both the user send and token-by-token growth.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

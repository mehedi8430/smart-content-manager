"use client";

import { useEffect, useRef } from "react";
import { ChatMessageBubble } from "./chat-message-bubble";
import type { ChatMessage } from "@/types/chat.type";
import { EmptyState } from "@/components/empty-state";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatThreadProps {
  messages: ChatMessage[];
  isSessionPending: boolean;
  onStart: () => void;
}

export function ChatThread({ messages, isSessionPending, onStart }: ChatThreadProps) {
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
      {messages.length === 0 ? (
        <EmptyState
          className="my-auto"
          icon={<MessageSquare className="size-6" />}
          title="No chat history yet"
          description="Ask the copilot for an idea, rewrite, or next step for your campaign."
          action={
            <Button variant="outline" size="sm" onClick={onStart}>
              Start a conversation
            </Button>
          }
        />
      ) : (
        messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}

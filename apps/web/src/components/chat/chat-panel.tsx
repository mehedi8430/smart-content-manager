"use client";

import { useRef } from "react";
import { MessagesSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "./chat-thread";
import { ChatComposer } from "./chat-composer";
import { useChat } from "@/providers/chat-provider";
import { streamChatMessage } from "@/lib/chat-stream-client";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  /** The session id currently active in the sidebar. May be null on fresh load. */
  activeSessionId: string | null;
}

export function ChatPanel({ activeSessionId }: ChatPanelProps) {
  const { messages, appendUserMessage, startAssistantStream, appendStreamChunk, completeStream, isStreaming, streamError, setStreamError } =
    useChat();
  const abortControllerRef = useRef<AbortController | null>(null);
  // Stash the last user message so we can offer a retry on stream failure.
  const lastUserMessageRef = useRef<string>("");

  const handleSend = (content: string) => {
    if (!activeSessionId) return;

    lastUserMessageRef.current = content;
    setStreamError(null);

    // 1) Optimistically add the user's message to the thread.
    appendUserMessage(content);
    // 2) Seed the (empty) assistant bubble that appendStreamChunk fills in.
    startAssistantStream();

    // 3) Open the SSE stream; the hook calls our context setters per token / on done.
    abortControllerRef.current = new AbortController();
    streamChatMessage(
      activeSessionId,
      content,
      {
        onChunk: (chunk) => appendStreamChunk(chunk),
        onDone: (finalMessage) => completeStream(finalMessage),
        onError: (message) => setStreamError(message),
      },
      abortControllerRef.current.signal,
    );
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // Mirror the generator: mark as cancelled via the error channel so the
    // inline retry affordance appears.
    setStreamError("Generation cancelled");
  };

  const handleRetry = () => {
    if (lastUserMessageRef.current) {
      handleSend(lastUserMessageRef.current);
    }
  };

  // No session selected — don't render an empty thread; show a prompt state.
  if (!activeSessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary">
          <MessagesSquare className="size-6" />
        </div>
        <div>
          <p className="text-base font-medium">No conversation selected</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Pick a chat from the sidebar or start a new one to talk with your
            campaign copilot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatThread messages={messages} />

      {streamError && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="truncate">{streamError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/20"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      <ChatComposer
        isStreaming={isStreaming}
        onSend={handleSend}
        onCancel={handleCancel}
      />
    </div>
  );
}

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "./chat-thread";
import { ChatComposer } from "./chat-composer";
import { useChat } from "@/providers/chat-provider";
import { streamChatMessage } from "@/lib/chat-stream-client";
import { useChatSession, useCreateChatSession } from "@/hooks/server-state/use-chat-sessions";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/types/queryKeys";
import { usePathname } from "next/navigation";
import type { ChatMessage } from "@/types/chat.type";

interface ChatPanelProps {
  /** The session id currently active. May be null on fresh load. */
  activeSessionId: string | null;
}

export function ChatPanel({ activeSessionId }: ChatPanelProps) {
  const { isStreaming, setIsStreaming, streamError, setStreamError, setActiveSessionId: setActiveSessionIdFromContext } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const pathName = usePathname();
  
  const CAMPAIGN_ID_RE = /^\/dashboard\/campaigns\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const campaignMatch = pathName.match(CAMPAIGN_ID_RE);
  const campaignId = campaignMatch?.[1];

  const queryClient = useQueryClient();
  const { data: sessionData } = useChatSession(activeSessionId ?? undefined);
  const createSession = useCreateChatSession();

  // Sync messages from React Query when activeSessionId or sessionData changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setMessages(sessionData?.messages ?? []);
  }, [activeSessionId, sessionData]);

  const appendUserMessage = useCallback((content: string) => {
    if (!activeSessionId || !content.trim()) return;
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      sessionId: activeSessionId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
  }, [activeSessionId]);

  const startAssistantStream = useCallback(() => {
    setIsStreaming(true);
    setStreamError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-temp-${Date.now()}`,
        role: "assistant",
        content: "",
        sessionId: activeSessionId ?? "",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [activeSessionId, setIsStreaming, setStreamError]);

  const appendStreamChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "assistant") {
        next[next.length - 1] = { ...last, content: last.content + chunk };
      }
      return next;
    });
  }, []);

  const completeStream = useCallback(
    (finalMessage: ChatMessage) => {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.id.startsWith("assistant-temp-")
            ? finalMessage
            : m,
        ),
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
    [setIsStreaming, queryClient],
  );

  const handleSend = async (content: string) => {
    let sessionId = activeSessionId;

    // Auto-create a session if no active session exists
    if (!sessionId) {
      try {
        const newSession = await createSession.mutateAsync(campaignId);
        sessionId = newSession.id;
        setActiveSessionIdFromContext(sessionId);
      } catch (error) {
        setStreamError(
          error instanceof Error ? error.message : "Failed to create chat session",
        );
        return;
      }
    }

    lastUserMessageRef.current = content;
    setStreamError(null);

    appendUserMessage(content);
    startAssistantStream();

    abortControllerRef.current = new AbortController();
    streamChatMessage(
      sessionId,
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
    setStreamError("Generation cancelled");
  };

  const handleRetry = () => {
    if (lastUserMessageRef.current) {
      handleSend(lastUserMessageRef.current);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {activeSessionId && <ChatThread messages={messages} />}

      {streamError && (
        <div className="shrink-0 mx-4 mb-2 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
        isStreaming={isStreaming || createSession.isPending}
        onSend={handleSend}
        onCancel={handleCancel}
      />
    </div>
  );
}

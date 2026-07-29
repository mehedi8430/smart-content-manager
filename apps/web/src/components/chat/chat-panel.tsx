"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatThread } from "./chat-thread";
import { ChatComposer } from "./chat-composer";
import { useChat } from "@/providers/chat-provider";
import { streamChatMessage } from "@/lib/chat-stream-client";
import {
  useChatSession,
  useCreateChatSession,
} from "@/hooks/server-state/use-chat-sessions";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/types/queryKeys";
import { useParams } from "next/navigation";
import type { ChatMessage } from "@/types/chat.type";

export function ChatPanel() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const {
    isStreaming,
    setIsStreaming,
    streamError,
    setStreamError,
    activeSessionId,
    setActiveSessionId: setActiveSessionIdFromContext,
  } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");
  const localMessagesBySessionRef = useRef<Map<string, ChatMessage[]>>(
    new Map(),
  );

  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: isSessionPending } = useChatSession(
    activeSessionId ?? undefined,
  );
  const createSession = useCreateChatSession();

  // Sync messages from React Query when sessionData changes
  // Only sync when not streaming and sessionData has messages, to avoid overwriting optimistic updates
  useEffect(() => {
    if (isStreaming) return;

    // Check if we have local messages for this session
    const localMessages = activeSessionId
      ? localMessagesBySessionRef.current.get(activeSessionId)
      : null;

    if (sessionData?.messages && sessionData.messages.length > 0) {
      setMessages(sessionData.messages);
      // Clear local messages for this session since we have server data
      if (activeSessionId) {
        localMessagesBySessionRef.current.delete(activeSessionId);
      }
    } else if (localMessages && localMessages.length > 0) {
      // Restore local messages if we have them and server has no data yet
      setMessages(localMessages);
    } else {
      // Clear messages when there is no server data and no local data
      // (e.g. deleted session, newly selected empty session, null activeSessionId)
      setMessages([]);
    }
  }, [sessionData, isStreaming, activeSessionId]);

  const appendUserMessage = useCallback(
    (content: string, sessionId: string) => {
      if (!sessionId || !content.trim()) return;
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        sessionId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const newMessages = [...prev, optimistic];
        // Store in local messages map
        localMessagesBySessionRef.current.set(sessionId, newMessages);
        return newMessages;
      });
    },
    [],
  );

  const startAssistantStream = useCallback(
    (sessionId: string) => {
      setIsStreaming(true);
      setStreamError(null);
      setMessages((prev) => {
        const newMessage: ChatMessage = {
          id: `assistant-temp-${Date.now()}`,
          role: "assistant",
          content: "",
          sessionId,
          createdAt: new Date().toISOString(),
        };
        const newMessages = [...prev, newMessage];
        // Store in local messages map
        localMessagesBySessionRef.current.set(sessionId, newMessages);
        return newMessages;
      });
    },
    [setIsStreaming, setStreamError],
  );

  const appendStreamChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last && last.role === "assistant") {
        next[next.length - 1] = { ...last, content: last.content + chunk };
        // Update in local messages map
        if (last.sessionId) {
          localMessagesBySessionRef.current.set(last.sessionId, next);
        }
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
          error instanceof Error
            ? error.message
            : "Failed to create chat session",
        );
        return;
      }
    }

    lastUserMessageRef.current = content;
    setStreamError(null);

    appendUserMessage(content, sessionId);
    startAssistantStream(sessionId);

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
      <ChatThread messages={messages} isSessionPending={isSessionPending} />

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
        sessionId={activeSessionId}
      />
    </div>
  );
}

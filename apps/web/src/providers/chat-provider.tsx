"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/types/queryKeys";
import { useChatSession } from "@/hooks/server-state/use-chat-sessions";
import type { ChatMessage } from "@/types/chat.type";

interface ChatContextType {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  messages: ChatMessage[];
  appendUserMessage: (content: string) => void;
  startAssistantStream: () => void;
  appendStreamChunk: (chunk: string) => void;
  completeStream: (finalMessage: ChatMessage) => void;
  streamError: string | null;
  setStreamError: (error: string | null) => void;
  isStreaming: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // --- Plain useState only; no reducer / dispatch ---
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read the active session's messages from React Query using the proper hook.
  // This automatically fetches when activeSessionId changes.
  const { data: sessionData } = useChatSession(activeSessionId ?? undefined);

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
    // Seed an empty assistant bubble that appendStreamChunk fills in.
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
  }, [activeSessionId]);

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
      // Replace the temporary assistant bubble with the persisted server message.
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.id.startsWith("assistant-temp-")
            ? finalMessage
            : m,
        ),
      );
      // Refresh the sidebar list so updatedAt ordering + auto-derived title show up.
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
    [queryClient],
  );

  return (
    <ChatContext.Provider
      value={{
        activeSessionId,
        setActiveSessionId,
        messages,
        appendUserMessage,
        startAssistantStream,
        appendStreamChunk,
        completeStream,
        streamError,
        setStreamError,
        isStreaming,
        drawerOpen,
        setDrawerOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}

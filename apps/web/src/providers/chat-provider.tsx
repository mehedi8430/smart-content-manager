"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
} from "react";

/**
 * ChatContext holds only CLIENT/UI state — drawer visibility, active session selection,
 * and streaming status. All server state (messages, session details) lives in React Query
 * and is fetched by individual components using hooks like useChatSession().
 */
interface ChatContextType {
  // UI state: which session is currently selected
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;

  // UI state: drawer open/closed
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  // UI state: streaming status for the active session
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;

  // UI state: error message during streaming
  streamError: string | null;
  setStreamError: (error: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  return (
    <ChatContext.Provider
      value={{
        activeSessionId,
        setActiveSessionId,
        drawerOpen,
        setDrawerOpen,
        isStreaming,
        setIsStreaming,
        streamError,
        setStreamError,
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

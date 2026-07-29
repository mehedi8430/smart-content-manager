export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sessionId: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  campaignId: string | null;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

/** Lightweight projection returned by the list endpoint (no messages). */
export interface ChatSessionSummary {
  id: string;
  title: string | null;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
}

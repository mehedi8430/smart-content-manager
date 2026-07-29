import { api } from "@/api/axios";
import type {
  ChatSessionSummary,
  ChatSessionWithMessages,
} from "@/types/chat.type";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Convert any thrown value into a clean `Error`, preserving the backend message when available.
 * Mirrors the AI Outputs api helper exactly.
 */
function toAppError(error: unknown): Error {
  if (error && typeof error === "object" && "response" in error) {
    const res = (
      error as { response?: { data?: { message?: string }; status?: number } }
    ).response;
    if (res?.data?.message) {
      return new Error(res.data.message);
    }
    if (res?.status) {
      return new Error(`Request failed with status ${res.status}`);
    }
  }
  if (error instanceof Error) return error;
  return new Error("Unexpected error occurred");
}

/** Create a chat session (optionally campaign-scoped). */
export async function createChatSession(
  campaignId?: string,
): Promise<ChatSessionWithMessages> {
  try {
    const res = await api.post<ApiEnvelope<ChatSessionWithMessages>>(
      "/chat/sessions",
      campaignId ? { campaignId } : {},
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to create chat session");
    }
    return res.data.data as ChatSessionWithMessages;
  } catch (error) {
    throw toAppError(error);
  }
}

/** List chat sessions for the user (optionally filtered by campaignId). */
export async function listChatSessions(
  campaignId?: string,
): Promise<ChatSessionSummary[]> {
  try {
    const url = campaignId
      ? `/chat/sessions?campaignId=${encodeURIComponent(campaignId)}`
      : "/chat/sessions";
    const res = await api.get<ApiEnvelope<ChatSessionSummary[]>>(url);
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch chat sessions");
    }
    return res.data.data ?? [];
  } catch (error) {
    throw toAppError(error);
  }
}

/** Fetch a single chat session with its messages. */
export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionWithMessages> {
  try {
    const res = await api.get<ApiEnvelope<ChatSessionWithMessages>>(
      `/chat/sessions/${sessionId}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to fetch chat session");
    }
    return res.data.data as ChatSessionWithMessages;
  } catch (error) {
    throw toAppError(error);
  }
}

/** Rename a chat session. */
export async function renameChatSession(
  sessionId: string,
  title: string,
): Promise<ChatSessionWithMessages> {
  try {
    const res = await api.patch<ApiEnvelope<ChatSessionWithMessages>>(
      `/chat/sessions/${sessionId}`,
      { title },
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to rename chat session");
    }
    return res.data.data as ChatSessionWithMessages;
  } catch (error) {
    throw toAppError(error);
  }
}

/** Delete a chat session. Resolves with no value on success. */
export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    const res = await api.delete<ApiEnvelope<unknown>>(
      `/chat/sessions/${sessionId}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || "Failed to delete chat session");
    }
  } catch (error) {
    throw toAppError(error);
  }
}

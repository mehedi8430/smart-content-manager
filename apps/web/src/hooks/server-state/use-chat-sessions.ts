import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listChatSessions,
  getChatSession,
  renameChatSession,
  deleteChatSession,
  createChatSession,
} from "@/api/chat.api";
import { chatKeys } from "@/types/queryKeys";
import type { ChatSessionSummary } from "@/types/chat.type";
import { toast } from "sonner";

/**
 * Fetch the chat session list (sidebar). Optionally scoped by campaignId.
 */
export function useChatSessionsList(campaignId?: string) {
  return useQuery({
    queryKey: chatKeys.list(campaignId ?? ""),
    queryFn: () => listChatSessions(campaignId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single chat session with its messages.
 */
export function useChatSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(sessionId ?? ""),
    queryFn: () => getChatSession(sessionId as string),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Rename a chat session. Revalidates the list so the sidebar title updates.
 */
export function useRenameChatSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => renameChatSession(sessionId, title),

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename session",
      );
    },

    onSettled: () => {
      // Reconcile with the server whether we succeeded or failed.
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/**
 * Delete a chat session.
 * Optimistically remove the item from the list cache, roll back on failure,
 * and always revalidate to keep the cache in sync with the server.
 */
export function useDeleteChatSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteChatSession(sessionId),

    onMutate: async () => {
      // Cancel any in-flight list fetch so it can't overwrite our optimistic write.
      await queryClient.cancelQueries({ queryKey: chatKeys.lists() });

      const previous = queryClient.getQueryData<ChatSessionSummary[]>(
        chatKeys.list(""),
      );

      queryClient.setQueryData<ChatSessionSummary[]>(
        chatKeys.list(""),
        (old = []) => old.filter((session) => session.id !== sessionId),
      );

      return { previous };
    },

    onError: (error, _vars, context) => {
      // Roll back to the snapshot taken before the optimistic update.
      if (context?.previous) {
        queryClient.setQueryData(chatKeys.list(""), context.previous);
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to delete session",
      );
    },

    onSettled: () => {
      // Reconcile with the server whether we succeeded or rolled back.
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

/**
 * Create a new chat session (optionally campaign-scoped).
 * Invalidates the list so the new session appears in the sidebar.
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId?: string) => createChatSession(campaignId),

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create session",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    },
  });
}

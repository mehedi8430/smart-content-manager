import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAiOutputs, getAiOutput, deleteAiOutput } from "@/api/aiOutput.api";
import { aiOutputKeys } from "@/types/queryKeys";
import type { AiOutput } from "@/types/ai-output.type";
import { toast } from "sonner";

/**
 * Server-state hooks for AI outputs.
 * These are the ONLY place the UI talks to the AI-output API.
 */

/**
 * Fetch every AI output for a campaign.
 */
export function useAiOutputsList(campaignId: string | undefined) {
  return useQuery({
    queryKey: aiOutputKeys.list(campaignId ?? ""),
    queryFn: () => listAiOutputs(campaignId as string),
    enabled: Boolean(campaignId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single AI output by id (for a detail view or reuse-in-post flow).
 */
export function useAiOutput(campaignId: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: aiOutputKeys.detail(campaignId ?? "", id ?? ""),
    queryFn: () => getAiOutput(campaignId as string, id as string),
    enabled: Boolean(campaignId) && Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Delete an AI output
 * Optimistically remove the item from the cache, roll back on failure,
 * and always revalidate to keep the cache in sync with the server.
 */
export function useDeleteAiOutput(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAiOutput(campaignId, id),

    onMutate: async (id: string) => {
      // Cancel any in-flight list fetch so it can't overwrite our optimistic write.
      await queryClient.cancelQueries({ queryKey: aiOutputKeys.list(campaignId) });

      const previous = queryClient.getQueryData<AiOutput[]>(
        aiOutputKeys.list(campaignId),
      );

      queryClient.setQueryData<AiOutput[]>(aiOutputKeys.list(campaignId), (old = []) =>
        old.filter((output) => output.id !== id),
      );

      return { previous };
    },

    onSuccess: () => {
      toast.success("Output deleted successfully");
    },

    onError: (error, _id, context) => {
      // Roll back to the snapshot taken before the optimistic update.
      if (context?.previous) {
        queryClient.setQueryData(
          aiOutputKeys.list(campaignId),
          context.previous,
        );
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to delete output",
      );
    },

    onSettled: () => {
      // Reconcile with the server whether we succeeded or rolled back.
      queryClient.invalidateQueries({ queryKey: aiOutputKeys.list(campaignId) });
    },
  });
}

/**
 * Helpers for writing AI outputs into the React Query cache directly (used by
 * the SSE "done" flow, which is NOT a React Query fetch).
 */
export function useAiOutputCache() {
  const queryClient = useQueryClient();

  /**
   * Update the cached list immediately after saving. Replace the item if it
   * already exists (regenerate), otherwise add it to the top (new output).
   * Then mark the cache as stale so it syncs with the server on the next refetch.
   */
  const upsertOutputToCache = useCallback(
    (campaignId: string, output: AiOutput) => {
      queryClient.setQueryData<AiOutput[]>(
        aiOutputKeys.list(campaignId),
        (old = []) => {
          const exists = old.some((item) => item.id === output.id);
          return exists
            ? old.map((item) => (item.id === output.id ? output : item))
            : [output, ...old];
        },
      );

      queryClient.invalidateQueries({
        queryKey: aiOutputKeys.list(campaignId),
        refetchType: "none",
      });
    },
    [queryClient],
  );

  return { upsertOutputToCache };
}

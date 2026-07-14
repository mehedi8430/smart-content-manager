import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAiOutputs, getAiOutput, deleteAiOutput } from "@/api/aiOutput.api";
import { aiOutputKeys } from "@/lib/queryKeys";
import type { AiOutput } from "@/types/ai-output.type";
import { toast } from "sonner";

/**
 * Server-state hooks for AI outputs.
 *
 * These are the ONLY place the UI talks to the AI-output API. They sit on top
 * of the Axios data layer (see `@/api/aiOutput.api`) and TanStack Query, so
 * loading/error/caching is handled here rather than with manual useState/useEffect.
 */

/**
 * Fetch every AI output for a campaign.
 *
 * - `enabled` guards on `campaignId`: the query doesn't run until a real id
 *   exists, so we never fire a request for `undefined`.
 * - `staleTime` is intentionally long (5 min). Outputs only change when THIS
 *   app generates or deletes one, both of which update the cache directly, so
 *   there's no reason to refetch on every focus/mount and risk a refetch storm.
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
 * Same campaignId/id availability guard as the list hook.
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
 * Delete an AI output with an OPTIMISTIC update:
 *   - onMutate: remove the item from the cached list immediately, before the
 *     server confirms, so the delete feels instant. We snapshot the previous
 *     list so we can roll back.
 *   - onError: restore the snapshot and surface a toast so the user knows the
 *     delete didn't go through.
 *   - onSettled: invalidate the list regardless of outcome, so the cache is
 *     reconciled with the server and can't drift out of sync from a missed edge.
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
 * the SSE "done" flow, which is NOT a React Query fetch — see step 8).
 */
export function useAiOutputCache() {
  const queryClient = useQueryClient();

  /**
   * Write a freshly-saved output into a campaign's cached list immediately, so
   * the history reflects the new item without waiting on a refetch. We UPSERT:
   * if an output with the same id already exists (the SSE "done" from a
   * REGENERATE), replace it in place; otherwise PREPEND it (a brand-new
   * GENERATE). This keeps the cache correct for both flows and avoids
   * duplicating a regenerated item.
   *
   * We then MARK the query stale (refetchType: "none" => do NOT force an
   * immediate network call right after receiving fresh data) and let the next
   * natural refetch reconcile with the server.
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

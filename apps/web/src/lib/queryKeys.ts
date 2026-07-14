/**
 * Query key factory for AI outputs.
 *
 * Centralizing keys here (instead of hand-writing arrays in components) means
 * every feature that caches AI outputs uses the EXACT same key shape. That lets
 * us invalidate "all outputs for a campaign" or "one specific output" precisely,
 * by key structure alone — no string matching / fuzzy prefix hacks.
 *
 * Shape:
 *   ["ai-outputs"]                          -> the whole resource
 *   ["ai-outputs", "list", campaignId]      -> a campaign's list (used by list + delete)
 *   ["ai-outputs", "detail", campaignId, id]-> a single output (used by get-one)
 *
 * Because "list" and "detail" are nested under a stable "ai-outputs" root, a
 * future `queryClient.invalidateQueries({ queryKey: ["ai-outputs"] })` would
 * wipe the entire resource, while `invalidateQueries({ queryKey: ["ai-outputs",
 * "list", campaignId] })` targets just one campaign's list.
 */
export const aiOutputKeys = {
  /** Root key for everything AI-output related. */
  all: ["ai-outputs"] as const,

  /** All list queries (across campaigns). */
  lists: () => [...aiOutputKeys.all, "list"] as const,

  /** The list query for ONE campaign. */
  list: (campaignId: string) => [...aiOutputKeys.lists(), campaignId] as const,

  /** All detail queries (across campaigns). */
  details: () => [...aiOutputKeys.all, "detail"] as const,

  /** The detail query for ONE output. */
  detail: (campaignId: string, id: string) =>
    [...aiOutputKeys.details(), campaignId, id] as const,
};

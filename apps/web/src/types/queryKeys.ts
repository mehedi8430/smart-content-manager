/**
 * Query key factory for AI outputs.
 */
export const aiOutputKeys = {
  all: ["ai-outputs"] as const,
  lists: () => [...aiOutputKeys.all, "list"] as const,
  list: (campaignId: string) => [...aiOutputKeys.lists(), campaignId] as const,
  details: () => [...aiOutputKeys.all, "detail"] as const,
  detail: (campaignId: string, id: string) =>
    [...aiOutputKeys.details(), campaignId, id] as const,
};

/**
 * Query key factory for chat sessions.
 * Mirrors `aiOutputKeys` so devtools + cache invalidation stay consistent
 * project-wide. The list key is invalidated by mutations and by the SSE
 * "done" flow (so sidebar ordering / auto-derived titles refresh).
 */
export const chatKeys = {
  all: ["chat-sessions"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (campaignId: string) => [...chatKeys.lists(), campaignId] as const,
  details: () => [...chatKeys.all, "detail"] as const,
  detail: (sessionId: string) => [...chatKeys.details(), sessionId] as const,
};

/**
 * Query key factory for campaigns.
 * The list key is parameterized by the full query so that different
 * pagination/search/sort combinations cache independently. Mutations
 * invalidate all lists via `campaignKeys.lists()`.
 */
export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (query: Record<string, unknown>) =>
    [...campaignKeys.lists(), JSON.stringify(query)] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

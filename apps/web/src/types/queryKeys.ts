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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCampaignAction,
  deleteCampaignAction,
  listCampaignsAction,
  updateCampaignAction,
} from "@/actions/campaign.action";
import { campaignKeys } from "@/types/queryKeys";
import type {
  Campaign,
  CreateCampaignPayload,
  ListCampaignsQuery,
  PaginationMeta,
  UpdateCampaignPayload,
} from "@/types/campaign.type";
import { toast } from "sonner";

/**
 * Server-state hooks for campaigns.
 * These are the ONLY place the campaigns UI talks to the campaigns API.
 */

type CampaignListQuery = ListCampaignsQuery;

function normalizeListQuery(query: CampaignListQuery = {}) {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    search: query.search ?? "",
    sortBy: query.sortBy ?? "createdAt",
    sortOrder: query.sortOrder ?? "desc",
  };
}

/**
 * Fetch a paginated list of campaigns with search and sorting.
 * The query is the dependency so different filters cache independently.
 */
export function useCampaignsList(query: CampaignListQuery = {}) {
  const normalized = normalizeListQuery(query);

  return useQuery({
    queryKey: campaignKeys.list(normalized),
    queryFn: async () => {
      const result = await listCampaignsAction(normalized);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Create a campaign. Invalidates all campaign lists so the new campaign
 * appears immediately and Next.js is reconciled with the server.
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      const result = await createCampaignAction(payload);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      return result;
    },

    onSuccess: (result) => {
      if ("message" in result && result.message) {
        toast.success(result.message);
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create campaign",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Update a campaign. Invalidates the affected lists so the changes propagate.
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCampaignPayload;
    }) => {
      const result = await updateCampaignAction(id, payload);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      return result;
    },

    onSuccess: (result) => {
      if ("message" in result && result.message) {
        toast.success(result.message);
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update campaign",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Delete a campaign. Invalidates the lists so the removed campaign disappears.
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCampaignAction(id);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      return result;
    },

    onSuccess: (result) => {
      if ("message" in result && result.message) {
        toast.success(result.message);
      }
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete campaign",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

export type { Campaign, PaginationMeta, CampaignListQuery };

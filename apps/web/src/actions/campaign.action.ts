"use server";

import fetcher from "@/lib/fetcher";
import { revalidateTag } from "next/cache";
import {
  CampaignListResponse,
  CampaignResponse,
  CreateCampaignPayload,
  CreateCampaignResponse,
  DeleteCampaignResponse,
  ListCampaignsQuery,
  UpdateCampaignPayload,
  UpdateCampaignResponse,
} from "@/types/campaign.type";

/**
 * Create a new campaign
 */
export async function createCampaignAction(payload: CreateCampaignPayload) {
  try {
    const response = await fetcher<CreateCampaignResponse>("/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    revalidateTag("campaigns", "max");

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to create campaign. Please try again." };
  }
}

/**
 * List campaigns with pagination, search, and sorting
 */
export async function listCampaignsAction(query: ListCampaignsQuery = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (query.page) queryParams.append("page", query.page.toString());
    if (query.limit !== undefined) queryParams.append("limit", query.limit.toString());
    if (query.search) queryParams.append("search", query.search);
    if (query.sortBy) queryParams.append("sortBy", query.sortBy);
    if (query.sortOrder) queryParams.append("sortOrder", query.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/campaigns?${queryString}` : "/campaigns";

    const response = await fetcher<CampaignListResponse>(endpoint, {
      method: "GET",
      cache: "force-cache",
      next: { tags: ["campaigns"] },
    });

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to fetch campaigns. Please try again." };
  }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignAction(id: string) {
  try {
    const response = await fetcher<CampaignResponse>(`/campaigns/${id}`, {
      method: "GET",
    });

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to fetch campaign. Please try again." };
  }
}

/**
 * Update a campaign
 */
export async function updateCampaignAction(id: string, payload: UpdateCampaignPayload) {
  try {
    const response = await fetcher<UpdateCampaignResponse>(`/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    revalidateTag("campaigns", "max");

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to update campaign. Please try again." };
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaignAction(id: string) {
  try {
    const response = await fetcher<DeleteCampaignResponse>(`/campaigns/${id}`, {
      method: "DELETE",
    });

    revalidateTag("campaigns", "max");

    return {
      success: response.success,
      message: response.message,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to delete campaign. Please try again." };
  }
}

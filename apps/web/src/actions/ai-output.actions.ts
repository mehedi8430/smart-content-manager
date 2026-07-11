"use server";

import fetcher from "@/lib/fetcher";
import {
    DeleteAiOutputResponse,
    GetAiOutputResponse,
    ListAiOutputsResponse,
} from "@/types/ai-output.type";

/**
 * List AI outputs for a campaign
 */
export async function listAiOutputs(campaignId: string) {
    try {
        const response = await fetcher<ListAiOutputsResponse>(
            `/campaigns/${campaignId}/ai-outputs`,
            {
                method: "GET",
            }
        );

        return {
            success: response.success,
            message: response.message,
            data: response.data,
        };
    } catch (error) {
        if (error && typeof error === "object" && "message" in error) {
            return { error: (error as { message: string }).message };
        }

        return { error: "Failed to fetch AI outputs. Please try again." };
    }
}

/**
 * Get a single AI output by ID
 */
export async function getAiOutput(campaignId: string, id: string) {
    try {
        const response = await fetcher<GetAiOutputResponse>(
            `/campaigns/${campaignId}/ai-outputs/${id}`,
            {
                method: "GET",
            }
        );

        return {
            success: response.success,
            message: response.message,
            data: response.data,
        };
    } catch (error) {
        if (error && typeof error === "object" && "message" in error) {
            return { error: (error as { message: string }).message };
        }

        return { error: "Failed to fetch AI output. Please try again." };
    }
}

/**
 * Delete an AI output
 */
export async function deleteAiOutput(campaignId: string, id: string) {
    try {
        const response = await fetcher<DeleteAiOutputResponse>(
            `/campaigns/${campaignId}/ai-outputs/${id}`,
            {
                method: "DELETE",
            }
        );

        return {
            success: response.success,
            message: response.message,
        };
    } catch (error) {
        if (error && typeof error === "object" && "message" in error) {
            return { error: (error as { message: string }).message };
        }

        return { error: "Failed to delete AI output. Please try again." };
    }
}

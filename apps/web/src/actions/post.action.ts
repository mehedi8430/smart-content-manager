"use server";

import fetcher from "@/lib/fetcher";
import {
    BulkUpdateItem,
    BulkUpdatePostsResponse,
    CreatePostInput,
    CreatePostResponse,
    DeletePostResponse,
    ListPostsQuery,
    PostListResponse,
    PostStatus,
    UpdatePostInput,
    UpdatePostResponse,
    UpdatePostStatusResponse,
} from "@/types/post.type";

/**
 * List posts for a campaign with optional status filter
 */
export async function listPostsAction(campaignId: string, query: ListPostsQuery = {}) {
    try {
        const queryParams = new URLSearchParams();

        if (query.status) queryParams.append("status", query.status);
        if (query.search) queryParams.append("search", query.search);

        const queryString = queryParams.toString();
        const endpoint = queryString
            ? `/campaigns/${campaignId}/posts?${queryString}`
            : `/campaigns/${campaignId}/posts`;

        const response = await fetcher<PostListResponse>(endpoint, {
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

        return { error: "Failed to fetch posts. Please try again." };
    }
}

/**
 * Create a new post for a campaign
 */
export async function createPostAction(campaignId: string, payload: CreatePostInput) {
    try {
        const response = await fetcher<CreatePostResponse>(`/campaigns/${campaignId}/posts`, {
            method: "POST",
            body: JSON.stringify(payload),
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

        return { error: "Failed to create post. Please try again." };
    }
}

/**
 * Update a post
 */
export async function updatePostAction(
    campaignId: string,
    postId: string,
    payload: UpdatePostInput
) {
    try {
        const response = await fetcher<UpdatePostResponse>(
            `/campaigns/${campaignId}/posts/${postId}`,
            {
                method: "PATCH",
                body: JSON.stringify(payload),
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

        return { error: "Failed to update post. Please try again." };
    }
}

/**
 * Delete a post
 */
export async function deletePostAction(campaignId: string, postId: string) {
    try {
        const response = await fetcher<DeletePostResponse>(
            `/campaigns/${campaignId}/posts/${postId}`,
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

        return { error: "Failed to delete post. Please try again." };
    }
}

/**
 * Update post status only
 */
export async function updatePostStatusAction(
    campaignId: string,
    postId: string,
    status: PostStatus
) {
    try {
        const response = await fetcher<UpdatePostStatusResponse>(
            `/campaigns/${campaignId}/posts/${postId}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ status }),
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

        return { error: "Failed to update post status. Please try again." };
    }
}

/**
 * Bulk update posts (reorder/status)
 */
export async function bulkUpdatePostsAction(
    campaignId: string,
    items: BulkUpdateItem[]
) {
    try {
        const response = await fetcher<BulkUpdatePostsResponse>(
            `/campaigns/${campaignId}/posts/bulk-update`,
            {
                method: "PATCH",
                body: JSON.stringify({ items }),
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

        return { error: "Failed to bulk update posts. Please try again." };
    }
}

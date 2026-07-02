import { prisma } from '@/config/db';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger';
import type { CreatePostInput, UpdatePostInput } from '@/validators/post.validation';

/**
 * List posts for a campaign (optionally filtered by status)
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @param status - The status to filter by
 * @returns The list of posts
 */
export const listPosts = async (
  campaignId: string,
  userId: string,
  status?: string
) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.userId !== userId) {
      throw new ApiError(404, 'Campaign not found');
    }

    const where: any = { campaignId };
    if (status) where.status = status;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return posts;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error listing posts:', error);
    throw new ApiError(500, 'Failed to list posts');
  }
};

/**
 * Create a new post for a campaign
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @param data - The data to create
 * @returns The created post
 */
export const createPost = async (campaignId: string, userId: string, data: CreatePostInput) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (campaign.userId !== userId) {
      throw new ApiError(404, 'Campaign not found');
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        description: data.description ?? undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        order: data.order ?? undefined,
        status: data.status ?? undefined,
        campaignId,
      },
    });

    logger.info(`Post created: ${post.id} in campaign: ${campaignId}`);
    return post;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating post:', error);
    throw new ApiError(500, 'Failed to create post');
  }
};

/**
 * Update a post for a campaign
 * @param postId - The ID of the post
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @param data - The data to update
 * @returns The updated post
 */
export const updatePost = async (
  postId: string,
  campaignId: string,
  userId: string,
  data: UpdatePostInput
) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { campaign: true }
    });

    if (!post) throw new ApiError(404, 'Post not found');

    if (post.campaignId !== campaignId) throw new ApiError(404, 'Post not found');

    if (post.campaign.userId !== userId) throw new ApiError(404, 'Post not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.order !== undefined) updateData.order = data.order;

    const updated = await prisma.post.update({
      where: { id: postId },
      data: updateData
    });

    logger.info(`Post updated: ${postId}`);
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating post:', error);
    throw new ApiError(500, 'Failed to update post');
  }
};

/**
 * Delete a post for a campaign
 * @param postId - The ID of the post
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @returns Success object
 */
export const deletePost = async (
  postId: string,
  campaignId: string,
  userId: string
) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { campaign: true }
    });

    if (!post) throw new ApiError(404, 'Post not found');

    if (post.campaignId !== campaignId) throw new ApiError(404, 'Post not found');

    if (post.campaign.userId !== userId) throw new ApiError(404, 'Post not found');

    await prisma.post.delete({
      where: { id: postId }
    });

    logger.info(`Post deleted: ${postId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting post:', error);
    throw new ApiError(500, 'Failed to delete post');
  }
};

/**
 * Update post status
 * @param postId - The ID of the post
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @param status - The new status of the post
 * @returns The updated post
 */
export const updatePostStatus = async (
  postId: string,
  campaignId: string,
  userId: string,
  status: string
) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { campaign: true }
    });

    if (!post) throw new ApiError(404, 'Post not found');

    if (post.campaignId !== campaignId) throw new ApiError(404, 'Post not found');

    if (post.campaign.userId !== userId) throw new ApiError(404, 'Post not found');

    const updated = await prisma.post.update({ where: { id: postId }, data: { status } });

    logger.info(`Post status updated: ${postId} -> ${status}`);
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating post status:', error);
    throw new ApiError(500, 'Failed to update post status');
  }
};

/**
 * Bulk update posts for a campaign
 * @param campaignId - The ID of the campaign
 * @param userId - The ID of the user
 * @param posts - Array of post updates with id, status, and order
 * @returns Array of updated posts
 */
export const bulkUpdatePosts = async (
  campaignId: string,
  userId: string,
  posts: { id: string; status?: string; order?: number }[]
) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) throw new ApiError(404, 'Campaign not found');
    if (campaign.userId !== userId) throw new ApiError(404, 'Campaign not found');

    const ids = posts.map((p) => p.id);

    // Fetch posts that match the ids and campaign
    const existing = await prisma.post.findMany({
      where: {
        id: { in: ids },
        campaignId
      }
    });

    if (existing.length !== ids.length) {
      throw new ApiError(400, 'One or more posts are invalid for this campaign');
    }

    const updates = posts.map((p) => {
      const data: any = {};

      if (p.status !== undefined) data.status = p.status;
      if (p.order !== undefined) data.order = p.order;

      return prisma.post.update({
        where: { id: p.id },
        data
      });
    });

    // Execute all updates in a transaction
    const results = await prisma.$transaction(updates);

    return results;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error bulk updating posts:', error);
    throw new ApiError(500, 'Failed to bulk update posts');
  }
};

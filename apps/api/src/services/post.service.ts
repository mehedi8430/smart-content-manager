import { prisma } from '@/config/db';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger';
import type { CreatePostInput, UpdatePostInput } from '@/validators/post.validation';

/**
 * List posts for a campaign (optionally filtered by status)
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

    const posts = await prisma.post.findMany({ where });

    return posts;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error listing posts:', error);
    throw new ApiError(500, 'Failed to list posts');
  }
};

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

export const updatePost = async (
  postId: string,
  campaignId: string,
  userId: string,
  data: UpdatePostInput
) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { campaign: true } });

    if (!post) throw new ApiError(404, 'Post not found');

    if (post.campaignId !== campaignId) throw new ApiError(404, 'Post not found');

    if (post.campaign.userId !== userId) throw new ApiError(404, 'Post not found');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.post.update({ where: { id: postId }, data: updateData });

    logger.info(`Post updated: ${postId}`);
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating post:', error);
    throw new ApiError(500, 'Failed to update post');
  }
};

export const deletePost = async (postId: string, campaignId: string, userId: string) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { campaign: true } });

    if (!post) throw new ApiError(404, 'Post not found');

    if (post.campaignId !== campaignId) throw new ApiError(404, 'Post not found');

    if (post.campaign.userId !== userId) throw new ApiError(404, 'Post not found');

    await prisma.post.delete({ where: { id: postId } });

    logger.info(`Post deleted: ${postId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting post:', error);
    throw new ApiError(500, 'Failed to delete post');
  }
};

export const updatePostStatus = async (
  postId: string,
  campaignId: string,
  userId: string,
  status: string
) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { campaign: true } });

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

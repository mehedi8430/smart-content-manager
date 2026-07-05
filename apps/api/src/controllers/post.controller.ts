import { sendResponse } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  updatePostStatus,
  bulkUpdatePosts,
} from '@/services/post.service';
import type {
  CreatePostInput,
  UpdatePostInput,
  UpdatePostStatusInput
} from '@/validators/post.validation';

/**
 * Post Controller
 * Handles HTTP requests for post CRUD operations within campaigns
 */

/**
 * List posts for a campaign
 * @route GET /api/v1/campaigns/:campaignId/posts
 * @auth Requires valid JWT token
 * @query status (optional) - filter by status (todo, in_progress, done)
 * @returns List of posts ordered by order field
 */
const listPostsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId } = req.params as { campaignId: string };
  const { status, search } = req.query as { status?: string; search?: string };

  const posts = await listPosts(campaignId, userId, status, search);

  sendResponse(
    res,
    200,
    true,
    'Posts retrieved successfully',
    posts
  );
});

/**
 * Bulk update posts for a campaign
 * @route PATCH /api/v1/campaigns/:campaignId/posts/bulk-update
 * @auth Requires valid JWT token
 * @returns Updated posts array
 */
const bulkUpdatePostsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId } = req.params as { campaignId: string };
  const body = req.body as { posts: { id: string; status?: string; order?: number }[] };

  const updated = await bulkUpdatePosts(campaignId, userId, body.posts);

  sendResponse(
    res,
    200,
    true,
    'Posts bulk-updated successfully',
    updated
  );
});

/**
 * Create a new post for a campaign
 * @route POST /api/v1/campaigns/:campaignId/posts
 * @auth Requires valid JWT token
 * @returns Created post object
 */
const createPostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId } = req.params as { campaignId: string };
  const data: CreatePostInput = req.body;

  const post = await createPost(campaignId, userId, data);

  sendResponse(
    res,
    201,
    true,
    'Post created successfully',
    post
  );
});

/**
 * Update a post (partial update)
 * @route PATCH /api/v1/campaigns/:campaignId/posts/:postId
 * @auth Requires valid JWT token
 * @returns Updated post object
 */
const updatePostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };
  const data: UpdatePostInput = req.body;

  const post = await updatePost(postId, campaignId, userId, data);

  sendResponse(
    res,
    200,
    true,
    'Post updated successfully',
    post
  );
});

/**
 * Delete a post
 * @route DELETE /api/v1/campaigns/:campaignId/posts/:postId
 * @auth Requires valid JWT token
 * @returns Success message
 */
const deletePostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };

  await deletePost(postId, campaignId, userId);

  sendResponse(
    res,
    200,
    true,
    'Post deleted successfully'
  );
});

/**
 * Update post status
 * @route PATCH /api/v1/campaigns/:campaignId/posts/:postId/status
 * @auth Requires valid JWT token
 * @returns Updated post object
 */
const updatePostStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };
  const data: UpdatePostStatusInput = req.body;

  const post = await updatePostStatus(postId, campaignId, userId, data.status);

  sendResponse(
    res,
    200,
    true,
    'Post status updated successfully',
    post
  );
});

export {
  listPostsHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
  updatePostStatusHandler,
  bulkUpdatePostsHandler,
};

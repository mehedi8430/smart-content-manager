import { sendResponse } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  updatePostStatus,
} from '@/services/post.service';
import type { CreatePostInput, UpdatePostInput, UpdatePostStatusInput } from '@/validators/post.validation';

const listPostsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId } = req.params as { campaignId: string };
  const { status } = req.query as { status?: string };

  const posts = await listPosts(campaignId, userId, status);

  sendResponse(res, 200, true, 'Posts retrieved successfully', posts);
});

const createPostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId } = req.params as { campaignId: string };
  const data: CreatePostInput = req.body;

  const post = await createPost(campaignId, userId, data);

  sendResponse(res, 201, true, 'Post created successfully', post);
});

const updatePostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };
  const data: UpdatePostInput = req.body;

  const post = await updatePost(postId, campaignId, userId, data);

  sendResponse(res, 200, true, 'Post updated successfully', post);
});

const deletePostHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };

  await deletePost(postId, campaignId, userId);

  sendResponse(res, 200, true, 'Post deleted successfully');
});

const updatePostStatusHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { campaignId, postId } = req.params as { campaignId: string; postId: string };
  const data: UpdatePostStatusInput = req.body;

  const post = await updatePostStatus(postId, campaignId, userId, data.status);

  sendResponse(res, 200, true, 'Post status updated successfully', post);
});

export {
  listPostsHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
  updatePostStatusHandler,
};

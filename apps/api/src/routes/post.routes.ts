import { Router as createRouter, type Router } from 'express';
import {
  listPostsHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler,
  updatePostStatusHandler,
  bulkUpdatePostsHandler,
} from '@/controllers/post.controller';
import { validate } from '@/middleware/validate.middleware';
import { protect } from '@/middleware/auth.middleware';
import {
  createPostSchema,
  updatePostSchema,
  updatePostStatusSchema,
  bulkUpdatePostsSchema,
  campaignIdParamSchema,
  postIdParamSchema,
} from '@/validators/post.validation';

const router: Router = createRouter();

// All post routes require authentication
router.use(protect);

// GET /campaigns/:campaignId/posts
router.get('/:campaignId/posts', validate({ params: campaignIdParamSchema, query: updatePostStatusSchema.optional() }), listPostsHandler);

// POST /campaigns/:campaignId/posts
router.post('/:campaignId/posts', validate({ params: campaignIdParamSchema, body: createPostSchema }), createPostHandler);

// Bulk update should come BEFORE routes that match :postId to avoid matching 'bulk-update' as a postId
router.patch('/:campaignId/posts/bulk-update', validate({ params: campaignIdParamSchema, body: bulkUpdatePostsSchema }), bulkUpdatePostsHandler);

// PATCH /campaigns/:campaignId/posts/:postId
router.patch('/:campaignId/posts/:postId', validate({ params: campaignIdParamSchema.merge(postIdParamSchema), body: updatePostSchema }), updatePostHandler);

// DELETE /campaigns/:campaignId/posts/:postId
router.delete('/:campaignId/posts/:postId', validate({ params: campaignIdParamSchema.merge(postIdParamSchema) }), deletePostHandler);

// PATCH /campaigns/:campaignId/posts/:postId/status
router.patch('/:campaignId/posts/:postId/status', validate({ params: campaignIdParamSchema.merge(postIdParamSchema), body: updatePostStatusSchema }), updatePostStatusHandler);

export default router;

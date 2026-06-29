import { z } from 'zod';

export const postStatusEnum = z.enum(['todo', 'in_progress', 'done']);

export const createPostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  status: postStatusEnum.optional(),
});

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long').optional(),
    status: postStatusEnum.optional(),
  })
  .refine((data) => data.title !== undefined || data.status !== undefined, {
    message: 'At least one field (title or status) must be provided for update',
  });

export const updatePostStatusSchema = z.object({
  status: postStatusEnum,
});

export const campaignIdParamSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID format'),
});

export const postIdParamSchema = z.object({
  postId: z.string().uuid('Invalid post ID format'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>;

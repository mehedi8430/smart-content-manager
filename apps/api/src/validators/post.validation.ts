import { z } from 'zod';

export const postStatusEnum = z.enum(['todo', 'in_progress', 'done']);

export const createPostSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
    description: z.string().max(2000, 'Description is too long').optional(),
    dueDate: z.string().datetime('dueDate must be a valid ISO datetime').optional(),
    order: z.coerce.number().int().nonnegative().optional(),
    status: postStatusEnum.optional(),
  })
  .strict();

export const updatePostSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long').optional(),
    description: z.string().max(2000, 'Description is too long').optional(),
    dueDate: z.string().datetime('dueDate must be a valid ISO datetime').optional(),
    order: z.coerce.number().int().nonnegative().optional(),
    status: postStatusEnum.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.title !== undefined ||
      data.status !== undefined ||
      data.description !== undefined ||
      data.dueDate !== undefined ||
      data.order !== undefined,
    {
      message: 'At least one field (title, status, description, dueDate or order) must be provided for update',
    }
  );

export const updatePostStatusSchema = z
  .object({
    status: postStatusEnum,
  })
  .strict();

export const listPostsQuerySchema = z.object({
  status: postStatusEnum.optional(),
  search: z
    .string()
    .trim()
    .max(100, 'Search must be at most 100 characters')
    .optional(),
});

export const bulkUpdatePostsSchema = z
  .object({
    posts: z
      .array(
        z
          .object({
            id: z.uuid('Invalid post ID'),
            status: postStatusEnum.optional(),
            order: z.coerce.number().int().nonnegative().optional(),
          })
          .strict()
          .refine((p) => p.status !== undefined || p.order !== undefined, {
            message: 'Each post must include at least one of status or order',
          })
      )
      .min(1, 'Posts array must contain at least one item')
      .max(200, 'Posts array must contain at most 200 items'),
  })
  .strict();

export const campaignIdParamSchema = z.object({
  campaignId: z.uuid('Invalid campaign ID format'),
});

export const postIdParamSchema = z.object({
  postId: z.uuid('Invalid post ID format'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>;

import { z } from 'zod';

/**
 * Schema for creating a chat session
 */
export const createChatSessionSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID format').optional(),
});

/**
 * Schema for listing chat sessions (query params)
 */
export const listChatSessionsQuerySchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID format').optional(),
});

/**
 * Schema for updating a chat session (manual rename)
 */
export const updateChatSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
});

/**
 * Schema for getting/deleting a chat session by ID (params)
 */
export const chatSessionIdSchema = z.object({
  id: z.string().uuid('Invalid session ID format'),
});

/**
 * Schema for sending a chat message (streaming)
 */
export const sendChatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content is required')
    .max(8000, 'Message is too long'),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type ListChatSessionsQuery = z.infer<typeof listChatSessionsQuerySchema>;
export type UpdateChatSessionInput = z.infer<typeof updateChatSessionSchema>;

import { z } from 'zod';

/**
 * Schema for creating a campaign
 */
export const createCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
});

/**
 * Schema for updating a campaign (partial)
 */
export const updateCampaignSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
}).refine((data) => data.name !== undefined || data.description !== undefined, {
  message: 'At least one field (name or description) must be provided for update',
});

/**
 * Schema for listing campaigns (query params)
 */
export const listCampaignsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.union([
    z.coerce.number().int().positive().max(50),
    z.string().trim().toLowerCase().refine((value) => value === 'all', {
      message: 'Limit must be a positive number or "all"',
    }),
  ]).default(10),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for getting/deleting a campaign by ID (params)
 */
export const campaignIdSchema = z.object({
  id: z.string().uuid('Invalid campaign ID format'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsSchema>;
export type CampaignIdParams = z.infer<typeof campaignIdSchema>;

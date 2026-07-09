import { z } from 'zod';

export const contentTypeEnum = z.enum(['ad', 'caption', 'email']);

export const lengthEnum = z.enum(['short', 'medium', 'long']);

export const generateContentSchema = z.object({
    type: contentTypeEnum,
    prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(2000, 'Prompt is too long'),
    tone: z.string().optional(),
    keywords: z.array(z.string()).max(10, 'Maximum 10 keywords allowed').optional(),
    length: lengthEnum.optional(),
});

export const regenerateContentSchema = z.object({
    type: contentTypeEnum.optional(),
    prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(2000, 'Prompt is too long').optional(),
    tone: z.string().optional(),
    keywords: z.array(z.string()).max(10, 'Maximum 10 keywords allowed').optional(),
    length: lengthEnum.optional(),
});

export const campaignIdParamSchema = z.object({
    campaignId: z.string().uuid('Invalid campaign ID format'),
});

export const aiOutputIdParamSchema = z.object({
    id: z.string().uuid('Invalid AI output ID format'),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type RegenerateContentInput = z.infer<typeof regenerateContentSchema>;

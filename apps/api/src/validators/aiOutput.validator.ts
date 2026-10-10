import { z } from 'zod';

export const contentTypeEnum = z.enum(['ad', 'caption', 'email']);

export const lengthEnum = z.enum(['short', 'medium', 'long']);

export const toneEnum = z.enum([
  'Professional',
  'Playful',
  'Urgent',
  'Friendly',
  'Bold',
]);

const promptField = z
  .string()
  .trim()
  .min(3, 'Prompt must be at least 3 characters')
  .max(2000, 'Prompt is too long');

const keywordsField = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Keywords must not be empty')
      .max(200, 'Each keyword must be at most 200 characters')
  )
  .max(10, 'Maximum 10 keywords allowed')
  .optional();

const sharedFields = {
  type: contentTypeEnum,
  prompt: promptField,
  tone: toneEnum.optional(),
  keywords: keywordsField,
  length: lengthEnum.optional(),
};

export const generateContentSchema = z.object(sharedFields).strict();

export const regenerateContentSchema = z
  .object({
    type: sharedFields.type.optional(),
    prompt: sharedFields.prompt.optional(),
    tone: sharedFields.tone,
    keywords: sharedFields.keywords,
    length: sharedFields.length,
  })
  .strict();

export const campaignIdParamSchema = z.object({
  campaignId: z.uuid('Invalid campaign ID format'),
});

export const aiOutputIdParamSchema = z.object({
  id: z.uuid('Invalid AI output format'),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type RegenerateContentInput = z.infer<typeof regenerateContentSchema>;
export type Tone = z.infer<typeof toneEnum>;

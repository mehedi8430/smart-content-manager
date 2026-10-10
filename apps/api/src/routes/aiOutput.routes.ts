import { Router as createRouter, type Router } from 'express';
import {
    generateStream,
    regenerateStream,
    list,
    getOne,
    remove,
} from '@/controllers/aiOutput.controller';
import { validate } from '@/middleware/validate.middleware';
import { protect } from '@/middleware/auth.middleware';
import { aiLimiter } from '@/middleware/rateLimit.middleware';
import {
    generateContentSchema,
    regenerateContentSchema,
    campaignIdParamSchema,
    aiOutputIdParamSchema,
} from '@/validators/aiOutput.validator';

const router: Router = createRouter({ mergeParams: true });

// All AI output routes require authentication
router.use(protect);

// POST /campaigns/:campaignId/ai-outputs/generate (SSE streaming)
router.post(
    '/:campaignId/ai-outputs/generate',
    aiLimiter,
    validate({ params: campaignIdParamSchema, body: generateContentSchema }),
    generateStream
);

// POST /campaigns/:campaignId/ai-outputs/:id/regenerate (SSE streaming)
router.post(
    '/:campaignId/ai-outputs/:id/regenerate',
    aiLimiter,
    validate({ params: campaignIdParamSchema.merge(aiOutputIdParamSchema), body: regenerateContentSchema }),
    regenerateStream
);

// GET /campaigns/:campaignId/ai-outputs
router.get('/:campaignId/ai-outputs', validate({ params: campaignIdParamSchema }), list);

// GET /campaigns/:campaignId/ai-outputs/:id
router.get(
    '/:campaignId/ai-outputs/:id',
    validate({ params: campaignIdParamSchema.merge(aiOutputIdParamSchema) }),
    getOne
);

// DELETE /campaigns/:campaignId/ai-outputs/:id
router.delete(
    '/:campaignId/ai-outputs/:id',
    validate({ params: campaignIdParamSchema.merge(aiOutputIdParamSchema) }),
    remove
);

export default router;

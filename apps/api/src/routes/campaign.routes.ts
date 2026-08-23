import { Router as createRouter, type Router } from 'express';
import {
    createCampaignHandler,
    listCampaignsHandler,
    getCampaignHandler,
    updateCampaignHandler,
    deleteCampaignHandler,
} from '@/controllers/campaign.controller';
import { validate } from '@/middleware/validate.middleware';
import { protect } from '@/middleware/auth.middleware';
import {
    createCampaignSchema,
    updateCampaignSchema,
    listCampaignsSchema,
    campaignIdSchema,
} from '@/validators/campaign.validator';

const router: Router = createRouter();

// All campaign routes require authentication
router.use(protect);

// POST /api/v1/campaigns - Create a campaign
router.post(
    '/',
    validate({ body: createCampaignSchema }),
    createCampaignHandler
);

// GET /api/v1/campaigns - List campaigns (paginated, searchable, sortable)
router.get(
    '/',
    validate({ query: listCampaignsSchema }),
    listCampaignsHandler
);

// GET /api/v1/campaigns/:id - Get a single campaign
router.get(
    '/:id',
    validate({ params: campaignIdSchema }),
    getCampaignHandler
);

// PATCH /api/v1/campaigns/:id - Update a campaign
router.patch(
    '/:id',
    validate({ params: campaignIdSchema, body: updateCampaignSchema }),
    updateCampaignHandler
);

// DELETE /api/v1/campaigns/:id - Delete a campaign
router.delete(
    '/:id',
    validate({ params: campaignIdSchema }),
    deleteCampaignHandler
);

export default router;
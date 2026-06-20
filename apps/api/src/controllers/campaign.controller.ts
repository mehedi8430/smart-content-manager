import { sendResponse, sendError } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from '@/services/campaign.service';
import type { CreateCampaignInput, UpdateCampaignInput } from '@/validators/campaign.validator';

/**
 * Campaign Controller
 * Handles HTTP requests for campaign CRUD operations
 */

/**
 * Create a new campaign
 * @route POST /api/v1/campaigns
 * @auth Requires valid JWT token
 * @returns Created campaign object
 */
const createCampaignHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data: CreateCampaignInput = req.body;

  const campaign = await createCampaign(userId, data);

  sendResponse(
    res,
    201,
    true,
    'Campaign created successfully',
    campaign
  );
});

/**
 * List campaigns for the authenticated user
 * @route GET /api/v1/campaigns
 * @auth Requires valid JWT token
 * @query page, limit, search, sortBy, sortOrder
 * @returns Paginated list of campaigns with counts
 */
const listCampaignsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = req.query;

  const result = await listCampaigns(userId, query as any);

  sendResponse(
    res,
    200,
    true,
    'Campaigns retrieved successfully',
    result
  );
});

/**
 * Get a single campaign by ID
 * @route GET /api/v1/campaigns/:id
 * @auth Requires valid JWT token
 * @returns Campaign object with counts
 */
const getCampaignHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const campaignId = Array.isArray(id) ? id[0] : id;

  const campaign = await getCampaignById(campaignId, userId);

  sendResponse(
    res,
    200,
    true,
    'Campaign retrieved successfully',
    campaign
  );
});

/**
 * Update a campaign (partial update)
 * @route PATCH /api/v1/campaigns/:id
 * @auth Requires valid JWT token
 * @returns Updated campaign object
 */
const updateCampaignHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const campaignId = Array.isArray(id) ? id[0] : id;
  const data: UpdateCampaignInput = req.body;

  const campaign = await updateCampaign(campaignId, userId, data);

  sendResponse(
    res,
    200,
    true,
    'Campaign updated successfully',
    campaign
  );
});

/**
 * Delete a campaign
 * @route DELETE /api/v1/campaigns/:id
 * @auth Requires valid JWT token
 * @returns Success message
 */
const deleteCampaignHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const campaignId = Array.isArray(id) ? id[0] : id;

  await deleteCampaign(campaignId, userId);

  sendResponse(
    res,
    200,
    true,
    'Campaign deleted successfully'
  );
});

export {
  createCampaignHandler,
  listCampaignsHandler,
  getCampaignHandler,
  updateCampaignHandler,
  deleteCampaignHandler,
};

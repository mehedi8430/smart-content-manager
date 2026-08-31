import { prisma } from '@/config/db.config';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger.config';
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  ListCampaignsQuery,
} from '@/validators/campaign.validator';

/**
 * Campaign service layer - handles all business logic and Prisma operations
 */

/**
 * Create a new campaign for a user
 */
export const createCampaign = async (userId: string, data: CreateCampaignInput) => {
  try {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        userId,
      },
    });

    logger.info(`Campaign created: ${campaign.id} for user: ${userId}`);
    return campaign;
  } catch (error) {
    logger.error('Error creating campaign:', error);
    throw new ApiError(500, 'Failed to create campaign');
  }
};

/**
 * Get paginated list of campaigns for a user with search and sorting
 */
export const listCampaigns = async (userId: string, query: ListCampaignsQuery) => {
  const { page, limit, search, sortBy, sortOrder } = query;
  const isAll = limit === 'all';
  const pageLimit = isAll ? undefined : Number(limit);
  const skip = isAll ? 0 : (page - 1) * (pageLimit ?? 0);

  try {
    const where = {
      userId,
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const total = await prisma.campaign.count({ where });

    const campaigns = await prisma.campaign.findMany({
      where,
      skip,
      take: pageLimit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            posts: true,
            outputs: true,
          },
        },
      },
    });

    const totalPages = isAll ? 1 : Math.ceil(total / (pageLimit ?? 1));

    return {
      data: campaigns,
      pagination: {
        total,
        page,
        limit: isAll ? total : (pageLimit ?? total),
        totalPages,
      },
    };
  } catch (error) {
    logger.error('Error listing campaigns:', error);
    throw new ApiError(500, 'Failed to list campaigns');
  }
};

/**
 * Get a single campaign by ID (must belong to the user)
 */
export const getCampaignById = async (id: string, userId: string) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            outputs: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new ApiError(404, 'Campaign not found');
    }

    // Check ownership - return 404 instead of 403 to avoid leaking existence
    if (campaign.userId !== userId) {
      throw new ApiError(404, 'Campaign not found');
    }

    return campaign;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error getting campaign:', error);
    throw new ApiError(500, 'Failed to get campaign');
  }
};

/**
 * Update a campaign (partial update)
 */
export const updateCampaign = async (
  id: string,
  userId: string,
  data: UpdateCampaignInput
) => {
  try {
    // First verify ownership
    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (existing.userId !== userId) {
      throw new ApiError(404, 'Campaign not found');
    }

    // Build update data with only provided fields
    const updateData: { name?: string; description?: string | null } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            posts: true,
            outputs: true,
          },
        },
      },
    });

    logger.info(`Campaign updated: ${campaign.id} by user: ${userId}`);
    return campaign;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error updating campaign:', error);
    throw new ApiError(500, 'Failed to update campaign');
  }
};

/**
 * Delete a campaign (cascade deletes posts and outputs)
 */
export const deleteCampaign = async (id: string, userId: string) => {
  try {
    // First verify ownership
    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Campaign not found');
    }

    if (existing.userId !== userId) {
      throw new ApiError(404, 'Campaign not found');
    }

    // Delete campaign (cascade delete will handle posts and outputs)
    await prisma.campaign.delete({
      where: { id },
    });

    logger.info(`Campaign deleted: ${id} by user: ${userId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('Error deleting campaign:', error);
    throw new ApiError(500, 'Failed to delete campaign');
  }
};

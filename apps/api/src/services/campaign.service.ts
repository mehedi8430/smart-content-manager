import { prisma } from '@/config/db.config';
import { ApiError } from '@/utils/apiResponse';
import TTLCache from '@/utils/cache';
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
 * In-memory caches for read-heavy campaign data. Keyed by the owning user so
 * cached rows are never served across tenants. Writes invalidate explicitly
 * to keep the cache coherent within this process.
 */
const campaignCache = new TTLCache<string, unknown>(60_000, 2000);
const userListKeys = new Map<string, Set<string>>();

/** Invalidate every cached campaign list for a user on any write. */
function invalidateUserLists(userId: string) {
  const keys = userListKeys.get(userId);
  if (!keys) return;
  keys.forEach((key) => campaignCache.del(key));
  userListKeys.delete(userId);
}

/** Remember a list key so a later write can invalidate it. */
function trackListKey(userId: string, key: string) {
  const keys = userListKeys.get(userId) ?? new Set<string>();
  keys.add(key);
  userListKeys.set(userId, keys);
}

type CampaignListResult = {
  data: Awaited<ReturnType<typeof prisma.campaign.findMany>>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

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
    invalidateUserLists(userId);
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

  const cacheKey = `campaigns:${userId}:${JSON.stringify(query)}`;
  const cached = campaignCache.get(cacheKey);
  if (cached) return cached as CampaignListResult;

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

    const result = {
      data: campaigns,
      pagination: {
        total,
        page,
        limit: isAll ? total : (pageLimit ?? total),
        totalPages,
      },
    };

    trackListKey(userId, cacheKey);
    campaignCache.set(cacheKey, result);

    return result;
  } catch (error) {
    logger.error('Error listing campaigns:', error);
    throw new ApiError(500, 'Failed to list campaigns');
  }
};

/**
 * Get a single campaign by ID (must belong to the user)
 */
export const getCampaignById = async (id: string, userId: string) => {
  const cacheKey = `campaign:${id}:${userId}`;
  const cached = campaignCache.get(cacheKey);
  if (cached) return cached;

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

    campaignCache.set(cacheKey, campaign);
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

    invalidateUserLists(userId);
    campaignCache.del(`campaign:${campaign.id}:${userId}`);
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

    invalidateUserLists(userId);
    campaignCache.del(`campaign:${id}:${userId}`);
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

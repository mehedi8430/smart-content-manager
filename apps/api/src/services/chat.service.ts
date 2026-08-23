import { prisma } from '@/config/db.config';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger.config';
import type {
  CreateChatSessionInput,
  UpdateChatSessionInput,
  ListChatSessionsQuery,
} from '@/validators/chat.validator';

/**
 * Chat session service layer - handles all business logic and Prisma operations
 */

/**
 * Create a new chat session for a user (optionally campaign-scoped)
 */
export const createChatSession = async (
  userId: string,
  data: CreateChatSessionInput
) => {
  try {
    // If a campaignId is provided, verify it exists and belongs to the user.
    if (data.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: data.campaignId },
      });

      if (!campaign || campaign.userId !== userId) {
        throw new ApiError(404, 'Campaign not found');
      }
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        campaignId: data.campaignId ?? null,
        title: null,
      },
      include: {
        messages: true,
      },
    });

    logger.info(`Chat session created: ${session.id} for user: ${userId}`);
    return session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error creating chat session:', error);
    throw new ApiError(500, 'Failed to create chat session');
  }
};

/**
 * List chat sessions for a user, ordered by most-recently-updated first.
 * Optionally filtered by campaignId. Returns a light projection (no messages)
 * to power the sidebar without N+1 queries.
 */
export const listChatSessions = async (
  userId: string,
  query: ListChatSessionsQuery
) => {
  const { campaignId } = query;

  try {
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId,
        ...(campaignId && { campaignId }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        campaignId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sessions;
  } catch (error) {
    logger.error('Error listing chat sessions:', error);
    throw new ApiError(500, 'Failed to list chat sessions');
  }
};

/**
 * Get a single chat session (with messages) by ID, scoped to the user.
 */
export const getChatSession = async (id: string, userId: string) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new ApiError(404, 'Chat session not found');
    }

    // Check ownership - return 404 instead of 403 to avoid leaking existence
    if (session.userId !== userId) {
      throw new ApiError(404, 'Chat session not found');
    }

    return session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error getting chat session:', error);
    throw new ApiError(500, 'Failed to get chat session');
  }
};

/**
 * Update a chat session (manual title rename), scoped to the user.
 */
export const updateChatSession = async (
  id: string,
  userId: string,
  data: UpdateChatSessionInput
) => {
  try {
    const existing = await prisma.chatSession.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Chat session not found');
    }

    if (existing.userId !== userId) {
      throw new ApiError(404, 'Chat session not found');
    }

    const session = await prisma.chatSession.update({
      where: { id },
      data: {
        title: data.title,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    logger.info(`Chat session updated: ${session.id} by user: ${userId}`);
    return session;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating chat session:', error);
    throw new ApiError(500, 'Failed to update chat session');
  }
};

/**
 * Delete a chat session (cascade deletes messages), scoped to the user.
 */
export const deleteChatSession = async (id: string, userId: string) => {
  try {
    const existing = await prisma.chatSession.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Chat session not found');
    }

    if (existing.userId !== userId) {
      throw new ApiError(404, 'Chat session not found');
    }

    await prisma.chatSession.delete({
      where: { id },
    });

    logger.info(`Chat session deleted: ${id} by user: ${userId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting chat session:', error);
    throw new ApiError(500, 'Failed to delete chat session');
  }
};

import { prisma } from '@/config/db.config';
import { ApiError } from '@/utils/apiResponse';
import logger from '@/config/logger.config';

/**
 * Verify campaign ownership helper
 */
export const verifyCampaignOwnership = async (campaignId: string, userId: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new ApiError(404, 'Campaign not found');
  }

  if (campaign.userId !== userId) {
    throw new ApiError(404, 'Campaign not found');
  }

  return campaign;
};

/**
 * List AI outputs for a campaign
 */
export const listAiOutputs = async (campaignId: string, userId: string) => {
  await verifyCampaignOwnership(campaignId, userId);

  const outputs = await prisma.aiOutput.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });

  return outputs;
};

/**
 * Get a single AI output by ID
 */
export const getAiOutput = async (id: string, campaignId: string, userId: string) => {
  await verifyCampaignOwnership(campaignId, userId);

  const output = await prisma.aiOutput.findUnique({
    where: { id },
  });

  if (!output) {
    throw new ApiError(404, 'AI output not found');
  }

  if (output.campaignId !== campaignId) {
    throw new ApiError(404, 'AI output not found');
  }

  return output;
};

/**
 * Delete an AI output
 */
export const deleteAiOutput = async (id: string, campaignId: string, userId: string) => {
  await verifyCampaignOwnership(campaignId, userId);

  const output = await prisma.aiOutput.findUnique({
    where: { id },
  });

  if (!output) {
    throw new ApiError(404, 'AI output not found');
  }

  if (output.campaignId !== campaignId) {
    throw new ApiError(404, 'AI output not found');
  }

  await prisma.aiOutput.delete({
    where: { id },
  });

  logger.info(`AI output deleted: ${id} by user: ${userId}`);
  return { success: true };
};

/**
 * Create an AI output
 */
export const createAiOutput = async (
  campaignId: string,
  userId: string,
  data: {
    type: string;
    title?: string;
    prompt: string;
    tone?: string;
    content: string;
    tokensUsed: number;
    model: string;
  }
) => {
  await verifyCampaignOwnership(campaignId, userId);

  const output = await prisma.aiOutput.create({
    data: {
      type: data.type,
      title: data.title,
      prompt: data.prompt,
      tone: data.tone,
      content: data.content,
      tokensUsed: data.tokensUsed,
      model: data.model,
      status: 'completed',
      campaignId,
    },
  });

  logger.info(`AI output created: ${output.id} for campaign: ${campaignId}`);
  return output;
};

/**
 * Update an AI output (for regeneration)
 */
export const updateAiOutput = async (
  id: string,
  campaignId: string,
  userId: string,
  data: {
    type?: string;
    title?: string;
    prompt?: string;
    tone?: string;
    content: string;
    tokensUsed: number;
    model: string;
  }
) => {
  await verifyCampaignOwnership(campaignId, userId);

  const output = await prisma.aiOutput.findUnique({
    where: { id },
  });

  if (!output) {
    throw new ApiError(404, 'AI output not found');
  }

  if (output.campaignId !== campaignId) {
    throw new ApiError(404, 'AI output not found');
  }

  const updated = await prisma.aiOutput.update({
    where: { id },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.prompt !== undefined && { prompt: data.prompt }),
      ...(data.tone !== undefined && { tone: data.tone }),
      content: data.content,
      tokensUsed: data.tokensUsed,
      model: data.model,
      status: 'completed',
    },
  });

  logger.info(`AI output updated: ${id} for campaign: ${campaignId}`);
  return updated;
};

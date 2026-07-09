import { Request, Response } from 'express';
import { streamGenerateContent } from '@/services/ai/ai.service';
import {
    verifyCampaignOwnership,
    listAiOutputs,
    getAiOutput,
    deleteAiOutput,
    createAiOutput,
    updateAiOutput,
} from '@/services/aiOutput.service';
import type { GenerateContentInput, RegenerateContentInput } from '@/validators/aiOutput.validator';
import logger from '@/config/logger.config';

/**
 * Generate AI content with streaming (SSE)
 * @route POST /api/v1/campaigns/:campaignId/ai-outputs/generate
 */
const generateStream = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { campaignId } = req.params as { campaignId: string };
    const data = req.body as GenerateContentInput;

    // Verify campaign ownership
    const campaign = await verifyCampaignOwnership(campaignId, userId);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Track if client disconnected
    let isDisconnected = false;
    req.on('close', () => {
        isDisconnected = true;
    });

    try {
        const campaignContext = {
            name: campaign.name,
            description: campaign.description,
        };

        let fullContent = '';
        let tokensUsed = 0;
        let model = '';

        // Stream generation
        const generator = streamGenerateContent(data, campaignContext);
        let result: { content: string; tokensUsed: number; model: string } | null = null;

        for await (const chunk of generator) {
            if (isDisconnected) {
                logger.info('Client disconnected during generation');
                break;
            }

            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        // Get the final result from the generator
        const finalResult = await generator.next();
        if (finalResult.value && typeof finalResult.value !== 'string') {
            tokensUsed = finalResult.value.tokensUsed;
            model = finalResult.value.model;
            fullContent = finalResult.value.content;
        }

        if (isDisconnected) {
            res.end();
            return;
        }

        // Generate title from first ~8 words of content or prompt
        const words = fullContent.split(/\s+/).slice(0, 8);
        const title = words.length > 0 ? words.join(' ') : data.prompt.slice(0, 50);

        // Persist the AI output
        const savedRecord = await createAiOutput(campaignId, userId, {
            type: data.type,
            title,
            prompt: data.prompt,
            tone: data.tone,
            content: fullContent,
            tokensUsed,
            model,
        });

        res.write(`data: ${JSON.stringify({ type: 'done', output: savedRecord })}\n\n`);
        res.end();
    } catch (error) {
        logger.error('AI generation error', { error });
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed, please try again.' })}\n\n`);
        res.end();
    }
};

/**
 * Regenerate AI content with streaming (SSE)
 * @route POST /api/v1/campaigns/:campaignId/ai-outputs/:id/regenerate
 */
const regenerateStream = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { campaignId, id } = req.params as { campaignId: string; id: string };
    const data = req.body as RegenerateContentInput;

    // Verify campaign ownership
    const campaign = await verifyCampaignOwnership(campaignId, userId);

    // Get existing AI output
    const existingOutput = await getAiOutput(id, campaignId, userId);

    // Merge with existing data (body can override)
    const mergedData: GenerateContentInput = {
        type: data.type || (existingOutput.type as 'ad' | 'caption' | 'email'),
        prompt: data.prompt || existingOutput.prompt,
        tone: data.tone !== undefined ? data.tone : existingOutput.tone || undefined,
        keywords: data.keywords,
        length: data.length,
    };

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Track if client disconnected
    let isDisconnected = false;
    req.on('close', () => {
        isDisconnected = true;
    });

    try {
        const campaignContext = {
            name: campaign.name,
            description: campaign.description,
        };

        let fullContent = '';
        let tokensUsed = 0;
        let model = '';

        // Stream generation
        const generator = streamGenerateContent(mergedData, campaignContext);
        let result: { content: string; tokensUsed: number; model: string } | null = null;

        for await (const chunk of generator) {
            if (isDisconnected) {
                logger.info('Client disconnected during regeneration');
                break;
            }

            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        // Get the final result from the generator
        const finalResult = await generator.next();
        if (finalResult.value && typeof finalResult.value !== 'string') {
            tokensUsed = finalResult.value.tokensUsed;
            model = finalResult.value.model;
            fullContent = finalResult.value.content;
        }

        if (isDisconnected) {
            res.end();
            return;
        }

        // Generate title from first ~8 words of content or prompt
        const words = fullContent.split(/\s+/).slice(0, 8);
        const title = words.length > 0 ? words.join(' ') : mergedData.prompt.slice(0, 50);

        // Update the existing AI output
        const updatedRecord = await updateAiOutput(id, campaignId, userId, {
            type: mergedData.type,
            title,
            prompt: mergedData.prompt,
            tone: mergedData.tone,
            content: fullContent,
            tokensUsed,
            model,
        });

        res.write(`data: ${JSON.stringify({ type: 'done', output: updatedRecord })}\n\n`);
        res.end();
    } catch (error) {
        logger.error('AI regeneration error', { error });
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed, please try again.' })}\n\n`);
        res.end();
    }
};

/**
 * List AI outputs for a campaign
 * @route GET /api/v1/campaigns/:campaignId/ai-outputs
 */
const list = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { campaignId } = req.params as { campaignId: string };

    const outputs = await listAiOutputs(campaignId, userId);

    res.status(200).json({
        success: true,
        data: outputs,
        message: 'AI outputs retrieved successfully',
    });
};

/**
 * Get a single AI output
 * @route GET /api/v1/campaigns/:campaignId/ai-outputs/:id
 */
const getOne = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { campaignId, id } = req.params as { campaignId: string; id: string };

    const output = await getAiOutput(id, campaignId, userId);

    res.status(200).json({
        success: true,
        data: output,
        message: 'AI output retrieved successfully',
    });
};

/**
 * Delete an AI output
 * @route DELETE /api/v1/campaigns/:campaignId/ai-outputs/:id
 */
const remove = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { campaignId, id } = req.params as { campaignId: string; id: string };

    await deleteAiOutput(id, campaignId, userId);

    res.status(204).send();
};

export {
    generateStream,
    regenerateStream,
    list,
    getOne,
    remove,
};

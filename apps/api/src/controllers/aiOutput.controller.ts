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

// This implementation uses Async Generators + Server-Sent Events (SSE) to stream AI responses from Anthropic to the browser in real time while saving the final result to the database
// Frontend
//    │
//    │ POST /generate
//    ▼
// generateStream()
//    │
//    ▼
// streamGenerateContent()
//    │
//    ▼
// Claude
//    │
//    ├── "Hello"
//    │      ▲
//    │      │ yield
//    ▼
// generateStream()
//    │
//    ├── res.write(chunk)
//    ▼
// Browser updates UI

// Claude
//    │
//    ├── " World"
//    │
//    ▼
// Browser updates UI

// Claude
//    │
//    ├── finished
//    ▼
// streamGenerateContent() returns
// {
//   content,
//   tokensUsed,
//   model
// }
//    │
//    ▼
// generateStream()
//    │
//    ├── save database
//    ├── send "done"
//    └── end response

/**
 * Generate AI content with streaming (SSE).
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

        for await (const chunk of generator) {
            if (isDisconnected) {
                logger.info('Client disconnected during generation');
                await generator.return(undefined as any); // let the generator clean up
                break;
            }

            fullContent += chunk;
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        }

        const finalResult = await generator.next();

        if (finalResult.value && typeof finalResult.value !== 'string') {
            tokensUsed = finalResult.value.tokensUsed;
            model = finalResult.value.model;
            fullContent = finalResult.value.content;
        }

        // Drive the generator manually so we can capture BOTH
        // the yielded chunks AND the final return value.
        // while (true) {
        //     const step = await generator.next();

        //     if (step.done) {
        //         // step.value here is the GenerationResult returned by the generator
        //         if (step.value) {
        //             fullContent = step.value.content;
        //             tokensUsed = step.value.tokensUsed;
        //             model = step.value.model;
        //         }
        //         break;
        //     }

        //     if (isDisconnected) {
        //         logger.info('Client disconnected during generation');
        //         await generator.return(undefined as any); // let the generator clean up
        //         break;
        //     }

        //     fullContent += step.value;
        //     res.write(`data: ${JSON.stringify({ type: 'chunk', content: step.value })}\n\n`);
        // }

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
        logger.error('AI generation error', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
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

    res.status(200).json({
        success: true,
        message: 'AI output deleted successfully',
    });
};

export {
    generateStream,
    regenerateStream,
    list,
    getOne,
    remove,
};

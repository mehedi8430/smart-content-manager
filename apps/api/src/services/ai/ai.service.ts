import { anthropic, AI_MODEL, AI_MAX_TOKENS, AI_MOCK_MODE } from '../../config/ai.config';
import { GenerateContentInput, GenerationResult, AiGenerationError } from '../../types/ai.types';
import { getPromptBuilder } from './prompts';
import logger from '../../config/logger.config';
import { mockStreamGenerateContent } from './ai.mock.service';

export async function generateContent(
    input: GenerateContentInput,
    campaignContext: { name: string; description: string | null }
): Promise<GenerationResult> {
    try {
        const promptBuilder = getPromptBuilder(input.type);
        const { system, user } = promptBuilder(input, campaignContext);

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            system,
            messages: [
                {
                    role: 'user',
                    content: user,
                },
            ],
        });

        const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
        const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

        return {
            content,
            tokensUsed,
            model: AI_MODEL,
        };
    } catch (error) {
        logger.error('AI generation error', { error });
        throw new AiGenerationError('Failed to generate content. Please try again.');
    }
}

export async function* streamGenerateContent(
    input: GenerateContentInput,
    campaignContext: { name: string; description: string | null }
): AsyncGenerator<string, GenerationResult> {
    if (AI_MOCK_MODE) {
        const result = yield* mockStreamGenerateContent(input);
        return result;
    }

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
        const promptBuilder = getPromptBuilder(input.type);
        const { system, user } = promptBuilder(input, campaignContext);

        const stream = await anthropic.messages.stream({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            system,
            messages: [
                {
                    role: 'user',
                    content: user,
                },
            ],
        });

        // Process streaming events from Anthropic API:
        // content_block_delta with text_delta: yield text chunks for SSE and accumulate full content
        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const delta = event.delta.text;
                fullContent += delta;
                // sends this chunk to the caller immediately (for SSE streaming to the client)
                yield delta;
            } else if (event.type === 'message_start') {
                inputTokens = event.message.usage.input_tokens;
            } else if (event.type === 'message_delta') {
                outputTokens = event.usage.output_tokens;
            }
        }

        const tokensUsed = inputTokens + outputTokens;

        return {
            content: fullContent,
            tokensUsed,
            model: AI_MODEL,
        };
    } catch (error) {
        logger.error('AI streaming error', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw new AiGenerationError('Failed to generate content. Please try again.');
    }
}

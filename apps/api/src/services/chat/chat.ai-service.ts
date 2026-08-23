import { anthropic, AI_MODEL, AI_MAX_TOKENS, AI_MOCK_MODE } from '@/config/ai.config';
import { AiGenerationError } from '@/types/ai.types';
import logger from '@/config/logger.config';
import { mockStreamChatReply } from './chat.ai-service.mock';

export interface ChatMessageTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatGenerationParams {
  messages: ChatMessageTurn[];
  system: string;
  sessionId: string;
}

export interface ChatGenerationResult {
  fullContent: string;
  sessionId: string;
}

/**
 * Generate an AI chat reply as a streamed AsyncGenerator.
 *
 * Streams text chunks as they are generated while accumulating the complete
 * response, which is returned when the stream finishes for persistence.
 *
 * @param params Chat history, system prompt, and session metadata.
 * @returns An AsyncGenerator that yields text chunks and returns the full reply.
 * @throws {AiGenerationError} If the AI provider fails to generate a response.
 */
export async function* generateChatReply(
  params: ChatGenerationParams
): AsyncGenerator<string, ChatGenerationResult> {
  if (AI_MOCK_MODE) {
    const result = yield* mockStreamChatReply(params);
    return result;
  }

  let fullContent = '';
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const stream = await anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: params.system,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Process streaming events from the Anthropic API: yield text chunks for SSE and accumulate the full reply for persistence on completion.
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const delta = event.delta.text;
        fullContent += delta;
        yield delta;
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
      }
    }

    return {
      fullContent,
      sessionId: params.sessionId,
    };
  } catch (error) {
    logger.error('Chat AI generation error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new AiGenerationError('Failed to generate chat reply. Please try again.');
  }
}

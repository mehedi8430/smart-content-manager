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

// Mirrors the content-generator's GenerationResult shape ({ fullContent, ... })
export interface ChatGenerationResult {
  fullContent: string;
  sessionId: string;
}

/**
 * Generate a chat reply, streaming tokens via an AsyncGenerator.
 * Reuses the existing Anthropic client/constants from `@/config/ai.config`
 * 
 * (the same provider-abstracted module the content generator uses) — no
 * second AI client is created here.
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

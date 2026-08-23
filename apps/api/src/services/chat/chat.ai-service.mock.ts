import { ChatGenerationParams, ChatGenerationResult } from './chat.ai-service';

const FAKE_REPLY =
  "Got it — here's a quick plan for your campaign: lead with a clear value proposition, " +
  "schedule the posts we discussed, and reuse the caption draft we generated earlier. " +
  "Want me to expand any of these into a full asset?";

/**
 * Mock streaming generator — mirrors `mockStreamGenerateContent` from the F4
 * content generator. Same signature as the real `generateChatReply` so call
 * sites never branch on AI_MOCK_MODE.
 */
export async function* mockStreamChatReply(
  params: ChatGenerationParams
): AsyncGenerator<string, ChatGenerationResult> {
  const full = FAKE_REPLY;
  const words = full.split(' ');

  for (const word of words) {
    await new Promise((r) => setTimeout(r, 60)); // simulate token latency
    yield word + ' ';
  }

  return {
    fullContent: full,
    sessionId: params.sessionId,
  };
}

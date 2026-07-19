import { Request, Response } from 'express';
import { prisma } from '@/config/db.config';
import { getChatSession } from '@/services/chat.service';
import { generateChatReply, type ChatMessageTurn } from '@/services/chat/chat.ai-service';
import logger from '@/config/logger.config';

const GENERAL_SYSTEM_PROMPT =
  "You are a helpful marketing copilot. Answer the user's question clearly and concisely.";

/**
 * Stream an AI reply for a chat session
 * @route POST /api/v1/chat/sessions/:id/messages/stream
 * @auth Requires valid JWT token
 * @returns Server-Sent Events (SSE) stream of AI response chunks
 */
const streamMessageHandler = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const sessionId = Array.isArray(id) ? id[0] : id;
  const data = req.body as { content: string };

  // 1. Verify the session belongs to the user It also returns prior messages (asc), campaignId and title, which we need below.
  const session = await getChatSession(sessionId, userId);
  const isFirstExchange = session.messages.length === 0;

  // 2. Persist the user's message immediately, BEFORE streaming starts, so a dropped connection can never lose the user's input.
  await prisma.chatMessage.create({
    data: { role: 'user', content: data.content, sessionId },
  });

  // 3. Build the system prompt. If the session is campaign-scoped, fetch the campaign's posts + recent AiOutputs and inject them as a context preamble.
  let system: string;

  if (session.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: session.campaignId },
      include: {
        posts: {
          orderBy: { order: 'asc' },
          select: { title: true, status: true, dueDate: true },
        },
        outputs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { type: true, content: true, createdAt: true },
        },
      },
    });

    if (campaign) {
      // Build a readable summary of the campaign's tasks for the AI prompt.
      const tasks = campaign.posts
        .map((p) =>
          `- ${p.title} [${p.status}]${p.dueDate ? ` due ${new Date(p.dueDate).toISOString().slice(0, 10)}` : ''
          }`)
        .join('\n');

      // Include recent AI-generated content so the assistant has campaign context.
      const recent = campaign.outputs
        .map((o) => `- [${o.type}] ${o.content.slice(0, 120)}${o.content.length > 120 ? '…' : ''}`)
        .join('\n');

      // Build the system prompt with campaign context to help the AI give relevant answers.
      system =
        `You are a marketing copilot for the campaign '${campaign.name}'.\n` +
        `Current tasks:\n${tasks || '(none)'}\n\n` +
        `Recent generated content:\n${recent || '(none)'}\n\n` +
        `Answer the user's question using this context where relevant.`;
    } else {
      system = GENERAL_SYSTEM_PROMPT;
    }
  } else {
    system = GENERAL_SYSTEM_PROMPT;
  }

  // 4. Conversation history (prior messages) + the new user turn.
  const history: ChatMessageTurn[] = session.messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));
  history.push({ role: 'user', content: data.content });

  // 5. SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Track client disconnects.
  let isDisconnected = false;
  req.on('close', () => {
    isDisconnected = true;
  });

  try {
    // 6. Call the provider-abstracted generator (reuses the Anthropic client via ai.config).
    const generator = generateChatReply({ messages: history, system, sessionId });
    let fullContent = '';

    // 7. Manual while-loop consume (NOT for-await-of) so we can capture the final return value once done === true.
    while (true) {
      const step = await generator.next();

      if (step.done) {
        if (step.value && typeof step.value === 'object') {
          fullContent = step.value.fullContent;
        }
        break;
      }

      if (isDisconnected) {
        logger.info('Client disconnected during chat stream');
        await generator.return(undefined as any); // let the generator clean up
        res.end();
        return;
      }

      fullContent += step.value;
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: step.value })}\n\n`);
    }

    // 9. Auto-derive a title on the first exchange if none is set yet.
    const title = isFirstExchange && !session.title ? deriveTitle(data.content) : undefined;

    // 8 & 9. Persist the assistant reply and touch session.updatedAt (and set the derived title when applicable) in a single transaction.
    const updateData: { updatedAt: Date; title?: string } = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;

    const [assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: { role: 'assistant', content: fullContent, sessionId },
      }),
      prisma.chatSession.update({
        where: { id: sessionId },
        data: updateData,
      }),
    ]);

    res.write(`data: ${JSON.stringify({ type: 'done', output: assistantMessage })}\n\n`);
    res.end();
  } catch (error) {
    // 10. Emit a final SSE error event and end cleanly — never crash the connection.
    logger.error('Chat stream error', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed, please try again.' })}\n\n`);
    res.end();
  }
};

/**
 * Generate a short chat title from the user's first message.
 * Used only for the first exchange when the session has no title.
 */
function deriveTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  let title = '';

  for (const word of words) {
    const candidate = (title + ' ' + word).trim();
    if (candidate.length > 40) break;
    title = candidate;
  }
  const exceeded = content.trim().length > title.length;
  
  return exceeded ? `${title}…` : title;
}

export { streamMessageHandler };

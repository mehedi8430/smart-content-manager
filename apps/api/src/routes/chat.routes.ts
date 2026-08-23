import { Router as createRouter, type Router } from 'express';
import {
  createChatSessionHandler,
  listChatSessionsHandler,
  getChatSessionHandler,
  updateChatSessionHandler,
  deleteChatSessionHandler,
} from '@/controllers/chat.controller';
import { streamMessageHandler } from '@/controllers/chat.stream.controller';
import { validate } from '@/middleware/validate.middleware';
import { protect } from '@/middleware/auth.middleware';
import {
  createChatSessionSchema,
  listChatSessionsQuerySchema,
  updateChatSessionSchema,
  sendChatMessageSchema,
  chatSessionIdSchema,
} from '@/validators/chat.validator';

const router: Router = createRouter();

// All chat session routes require authentication
router.use(protect);

// POST /api/v1/chat/sessions - Create a chat session
router.post(
  '/sessions',
  validate({ body: createChatSessionSchema }),
  createChatSessionHandler
);

// GET /api/v1/chat/sessions - List chat sessions (lightweight, sidebar-friendly)
router.get(
  '/sessions',
  validate({ query: listChatSessionsQuerySchema }),
  listChatSessionsHandler
);

// GET /api/v1/chat/sessions/:id - Get a single chat session with messages
router.get(
  '/sessions/:id',
  validate({ params: chatSessionIdSchema }),
  getChatSessionHandler
);

// PATCH /api/v1/chat/sessions/:id - Update a chat session (rename)
router.patch(
  '/sessions/:id',
  validate({ params: chatSessionIdSchema, body: updateChatSessionSchema }),
  updateChatSessionHandler
);

// DELETE /api/v1/chat/sessions/:id - Delete a chat session
router.delete(
  '/sessions/:id',
  validate({ params: chatSessionIdSchema }),
  deleteChatSessionHandler
);

// POST /api/v1/chat/sessions/:id/messages/stream - Stream a chat reply (SSE)
router.post(
  '/sessions/:id/messages/stream',
  validate({ params: chatSessionIdSchema, body: sendChatMessageSchema }),
  streamMessageHandler
);

export default router;

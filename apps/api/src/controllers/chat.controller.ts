import { sendResponse } from '@/utils/apiResponse';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import {
  createChatSession,
  listChatSessions,
  getChatSession,
  updateChatSession,
  deleteChatSession,
} from '@/services/chat.service';
import type {
  CreateChatSessionInput,
  UpdateChatSessionInput,
  ListChatSessionsQuery,
} from '@/validators/chat.validator';

/**
 * Chat Session Controller
 * Handles HTTP requests for chat session CRUD operations
 */

/**
 * Create a new chat session
 * @route POST /api/v1/chat/sessions
 * @auth Requires valid JWT token
 * @returns Created chat session with empty messages array
 */
const createChatSessionHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data: CreateChatSessionInput = req.body;

  const session = await createChatSession(userId, data);

  sendResponse(
    res,
    201,
    true,
    'Chat session created successfully',
    session
  );
});

/**
 * List chat sessions for the authenticated user
 * @route GET /api/v1/chat/sessions
 * @auth Requires valid JWT token
 * @query campaignId (optional) - filter by campaign
 * @returns Lightweight list of sessions ordered by most recent first
 */
const listChatSessionsHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = req.query as ListChatSessionsQuery;

  const sessions = await listChatSessions(userId, query);

  sendResponse(
    res,
    200,
    true,
    'Chat sessions retrieved successfully',
    sessions
  );
});

/**
 * Get a single chat session by ID (with messages)
 * @route GET /api/v1/chat/sessions/:id
 * @auth Requires valid JWT token
 * @returns Chat session object with messages
 */
const getChatSessionHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const sessionId = Array.isArray(id) ? id[0] : id;

  const session = await getChatSession(sessionId, userId);

  sendResponse(
    res,
    200,
    true,
    'Chat session retrieved successfully',
    session
  );
});

/**
 * Update a chat session (manual rename)
 * @route PATCH /api/v1/chat/sessions/:id
 * @auth Requires valid JWT token
 * @returns Updated chat session object
 */
const updateChatSessionHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const sessionId = Array.isArray(id) ? id[0] : id;
  const data: UpdateChatSessionInput = req.body;

  const session = await updateChatSession(sessionId, userId, data);

  sendResponse(
    res,
    200,
    true,
    'Chat session updated successfully',
    session
  );
});

/**
 * Delete a chat session
 * @route DELETE /api/v1/chat/sessions/:id
 * @auth Requires valid JWT token
 * @returns Success message
 */
const deleteChatSessionHandler = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const sessionId = Array.isArray(id) ? id[0] : id;

  await deleteChatSession(sessionId, userId);

  sendResponse(
    res,
    200,
    true,
    'Chat session deleted successfully'
  );
});

export {
  createChatSessionHandler,
  listChatSessionsHandler,
  getChatSessionHandler,
  updateChatSessionHandler,
  deleteChatSessionHandler,
};

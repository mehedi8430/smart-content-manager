import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '@/config/env.config';

/**
 * All rate limiters live here. Every 429 uses the standard API envelope
 * `{ success: false, message }` so the frontend's error handling is uniform.
 *
 * NOTE: express-rate-limit uses an in-memory store by default, so counters are
 * per-process. That is acceptable for the current single Render instance but
 * NOT for horizontal scaling — move to a shared store (e.g. Redis) before
 * running more than one instance.
 */

type AuthedRequest = Request & { user?: { id: string } };

const exceeded =
  (message: string) =>
  (_req: Request, res: Response): void => {
    res.status(429).json({ success: false, message });
  };

/** Key authenticated requests by user id, falling back to the client IP. */
const userKey = (req: Request): string =>
  (req as AuthedRequest).user?.id ?? ipKeyGenerator(req.ip ?? '');

/** Global limiter — mounted on `/api` in app.ts. */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: exceeded('Too many requests from this IP, please try again later.'),
});

/**
 * Login / register. Successful requests are not counted so legitimate users
 * are not locked out by their own normal usage; only failures accumulate.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: exceeded('Too many authentication attempts, please try again later.'),
});

/**
 * Token refresh. Kept lenient: the web axios interceptor calls this
 * automatically whenever an access token expires.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: exceeded('Too many token refresh requests, please try again later.'),
});

/**
 * AI content generation / regeneration. Keyed per user (these routes are
 * mounted behind `protect`) so one account cannot burn the shared IP quota.
 * Must be applied after `protect` so `req.user` exists.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.AI_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: exceeded('Too many generation requests, please slow down.'),
});

/**
 * Chat streaming. Keyed per user; also behind `protect`. Rejects before the
 * SSE response starts so a limited request never opens a stream.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: userKey,
  handler: exceeded('Too many chat messages, please slow down.'),
});

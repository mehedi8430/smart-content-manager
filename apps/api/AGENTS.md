<!-- BEGIN:smart-content-manager-api -->
# Smart Content Manager — API (apps/api)

Express 5 + TypeScript REST API under `/api/v1`, backed by PostgreSQL via Prisma 7. Powers the Next.js frontend at `apps/web`.

## Monorepo context

- Turborepo + Bun workspaces. This package is `apps/api`; the frontend is `apps/web`.
- Build = `prisma generate && tsc && tsc-alias`. Prod start runs `prisma migrate deploy` — migrations are applied automatically on deploy, don't assume a manual migration step.
- Deployed on Render behind `https://smart-content-manager.onrender.com`.

## Request lifecycle (`app.ts`)

Middleware order is deliberate — don't reorder without understanding why:

1. `helmet()` — security headers, first.
2. `cors()` — origin from `CORS_ORIGIN` (comma-separated list) or `*`; `credentials: true` since auth uses cookies.
3. `cookieParser()` — needed before anything that reads auth cookies.
4. Rate limiter on `/api` only (`RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS`, default 100/15min) — returns a `{success: false, message}` shape on limit, not a generic 429 body. The AI generation route has its own separate, stricter limiter (5/min) — don't rely on the global one for that.
5. Body parsing (`json`/`urlencoded`, 10MB limit) — SSE streaming responses bypass this, they're outbound only.
6. `compression()`.
7. `morgan` — `dev` format outside production, `combined` piped into winston in production. Don't `console.log` in route handlers; use the winston logger (`config/logger.config`) so it lands in the rotating combined/error logs.
8. Routes at `/api/v1`.
9. `/health` — registered **before** the 404 handler (Express matches in registration order). Pings the DB via `prisma.$queryRaw`SELECT 1``; returns `503` with `db: 'disconnected'` on failure, `200` with `db: 'connected'` on success. Used by external uptime monitors (cron-job.org, UptimeRobot, GitHub Actions) to keep the Render instance warm and avoid cold-start lag on the first login after idle — don't make this endpoint cheap-but-meaningless by dropping the DB ping.
10. 404 handler, then the centralized `errorHandler` — always last. New error types should be handled by extending `errorHandler`, not by catching-and-formatting inline in controllers.

`app.set('trust proxy', 1)` is set for Render's reverse proxy — needed for rate limiting and secure cookies to see the real client IP/protocol. Don't remove it.

## Response shape

All JSON responses follow `{ success: boolean, message?: string, data?: ... }`. Keep this consistent in every new route — the frontend's axios/Server Action layer expects it uniformly, including on errors.

## Auth

Endpoints: `register`, `login`, `logout`, `get-me`, `refresh-token`.

- JWT access + refresh tokens, delivered as `httpOnly` cookies (also accept Bearer header — `protect` middleware checks both).
- Refresh tokens are persisted in the DB and rotated on refresh, revoked on logout — never issue a refresh token without storing/rotating it.
- `protect` middleware guards all non-auth routes.
- **Ownership checks return 404, not 403** — this is intentional (no existence leak on other users' resources). Match this pattern for any new owner-scoped resource; don't introduce 403s for "exists but not yours."

## Data model (Prisma)

- **User** — email, bcrypt hash, refresh token.
- **Campaign** — owned by User; cascade deletes Posts + AiOutputs on delete.
- **Post** — `status` (`todo|in_progress|done`), `order` (kanban position), belongs to Campaign.
- **AiOutput** — `type` (`ad|caption|email`), prompt, tone, content, model, tokensUsed, belongs to Campaign.
- **ChatSession** — optional `campaignId` (null = general chat), belongs to User, ordered by `updatedAt`.
- **ChatMessage** — `role` (`user|assistant`), belongs to Session.

Preserve cascade-delete behavior when adding related models — Campaign deletion must keep cleaning up its Posts/AiOutputs.

### Seed data (`prisma/seed.ts`)

Creates demo users (`demo@smartcontent.test`, `sarah@freelance.test`) with campaigns, posts, outputs, and chat sessions, for local dev/testing. Keep new seed data consistent with these accounts rather than introducing new demo users ad hoc.

## Validation

- zod schemas for **all** bodies/queries/params — no unchecked `req.body` access in controllers. Add a schema alongside any new route rather than validating ad hoc.

## Campaign caching

- Per-user in-memory TTL cache (60s) on campaign list reads, with explicit invalidation on writes (create/update/delete). If you add a new mutation on Campaign or its children that should affect list output (e.g. post/output counts), invalidate the same cache — don't let it go stale silently.

## Dashboard

- Backed by **one paginated campaigns query** with posts included — deliberately avoids N+1 queries for stat cards (active campaigns, content pieces, AI outputs, completion rate) and the recent-activity feed. If you add a new dashboard metric, extend this query rather than adding a second round-trip.

## AI generation endpoints

`POST /campaigns/:campaignId/ai-outputs/generate`, `POST .../ai-outputs/:id/regenerate`, plus list/get/delete.

- Rate-limited separately at 5/min — this is stricter than the global limiter and route-specific, don't fold it into the global one.
- Each content type (`ad|caption|email`) has its own dedicated prompt builder — CTA/subject-line/hashtag/platform logic lives there, not inlined in the route handler.
- Options: tone (Professional/Playful/Urgent/Friendly/Bold), length (Short/Medium/Long), comma-separated keywords; campaign name + description are injected as context — keep these as the canonical option sets if you extend generation.
- Responses **stream via SSE**, chunk-by-chunk. Must be disconnect-safe: if the client aborts, don't leave a half-written DB row — persist only after the stream completes, with an auto-generated title (first 8 words), model, and token usage.
- Regenerate reuses/merges the original output's params rather than requiring the client to resend everything.
- Env-configurable model/max-tokens; **mock mode** runs when no Anthropic API key is set — preserve this path so local dev works without a key, and don't add code that hard-fails without one.

## Chat endpoints

`POST /chat/sessions/messages/stream` (SSE) + session CRUD (`sessions` list/get/patch/delete).

- **Write-then-stream-then-commit** ordering matters: the user message is persisted *before* streaming starts; the assistant reply + session `updatedAt` touch are persisted together in a transaction *after* the stream ends. Don't persist the assistant message incrementally per-chunk.
- Campaign-scoped sessions auto-create/resume per campaign and inject that campaign's tasks (title/status/due) plus its 5 most recent AI outputs into the system prompt — keep this context-building logic centralized rather than duplicating it per call site.
- General chat (no `campaignId`) uses a generic copilot system prompt.
- Title is auto-derived from the first message's first few words; manual rename overrides it — don't overwrite a manually-set title on subsequent messages.

## Ops & shutdown (`server.ts`)

- Graceful shutdown: `SIGTERM`, `unhandledRejection`, and `uncaughtException` handlers all close the server and call `disconnectDB()` before exiting — any new long-lived resource (queues, sockets, etc.) should be wired into this same shutdown path, not left dangling.
- Logging goes through winston (`config/logger.config`), daily-rotate combined/error logs — errors in these handlers are logged via `logger.error`, not thrown further.

## Deployment

- Render, behind `https://smart-content-manager.onrender.com`.
- Build: `prisma generate && tsc && tsc-alias`.
- Prod start: runs `prisma migrate deploy` automatically — don't add a separate manual migration step to deploy docs/scripts.
<!-- END:smart-content-manager-api -->
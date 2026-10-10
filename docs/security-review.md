# Security review — rate limiting & input validation

Branch: `chore/security-review`. Scope: `apps/api` (plus web-side notes where relevant).

Status legend for the findings section: **confirmed and fixed** / **already OK** / **needs decision**.

---

## Route inventory

Baseline state at the start of the review (before fixes). Blank limiter cell = only the global
`/api` limiter applies. "strict?" = body schema rejects unknown fields.

| # | Method | Path (under `/api/v1`) | protect | body schema | query schema | params schema | route limiter | strict body? |
|---|--------|------------------------|---------|-------------|--------------|---------------|---------------|--------------|
| 1 | POST | `/auth/register` | – | `registerSchema` | – | – | – | no |
| 2 | POST | `/auth/login` | – | `loginSchema` | – | – | – | no |
| 3 | POST | `/auth/logout` | ✓ | – | – | – | – | – |
| 4 | GET | `/auth/me` | ✓ | – | – | – | – | – |
| 5 | POST | `/auth/refresh-token` | – | – | – | – | – | – |
| 6 | POST | `/campaigns` | ✓ | `createCampaignSchema` | – | – | – | no |
| 7 | GET | `/campaigns` | ✓ | – | `listCampaignsSchema` | – | – | – |
| 8 | GET | `/campaigns/:id` | ✓ | – | – | `campaignIdSchema` | – | – |
| 9 | PATCH | `/campaigns/:id` | ✓ | `updateCampaignSchema` | – | `campaignIdSchema` | – | no |
| 10 | DELETE | `/campaigns/:id` | ✓ | – | – | `campaignIdSchema` | – | – |
| 11 | GET | `/campaigns/:campaignId/posts` | ✓ | – | `listPostsQuerySchema` | `campaignId` | – | – |
| 12 | POST | `/campaigns/:campaignId/posts` | ✓ | `createPostSchema` | – | `campaignId` | – | no |
| 13 | PATCH | `/campaigns/:campaignId/posts/bulk-update` | ✓ | `bulkUpdatePostsSchema` | – | `campaignId` | – | no |
| 14 | PATCH | `/campaigns/:campaignId/posts/:postId` | ✓ | `updatePostSchema` | – | `campaignId`+`postId` | – | no |
| 15 | DELETE | `/campaigns/:campaignId/posts/:postId` | ✓ | – | – | `campaignId`+`postId` | – | – |
| 16 | PATCH | `/campaigns/:campaignId/posts/:postId/status` | ✓ | `updatePostStatusSchema` | – | `campaignId`+`postId` | – | no |
| 17 | POST | `/campaigns/:campaignId/ai-outputs/generate` (SSE) | ✓ | `generateContentSchema` | – | `campaignId` | ai limiter (IP) | no |
| 18 | POST | `/campaigns/:campaignId/ai-outputs/:id/regenerate` (SSE) | ✓ | `regenerateContentSchema` | – | `campaignId`+`id` | ai limiter (IP) | no |
| 19 | GET | `/campaigns/:campaignId/ai-outputs` | ✓ | – | – | `campaignId` | – | – |
| 20 | GET | `/campaigns/:campaignId/ai-outputs/:id` | ✓ | – | – | `campaignId`+`id` | – | – |
| 21 | DELETE | `/campaigns/:campaignId/ai-outputs/:id` | ✓ | – | – | `campaignId`+`id` | – | – |
| 22 | POST | `/chat/sessions` | ✓ | `createChatSessionSchema` | – | – | – | no |
| 23 | GET | `/chat/sessions` | ✓ | – | `listChatSessionsQuerySchema` | – | – | – |
| 24 | GET | `/chat/sessions/:id` | ✓ | – | – | `chatSessionIdSchema` | – | – |
| 25 | PATCH | `/chat/sessions/:id` | ✓ | `updateChatSessionSchema` | – | `chatSessionIdSchema` | – | no |
| 26 | DELETE | `/chat/sessions/:id` | ✓ | – | – | `chatSessionIdSchema` | – | – |
| 27 | POST | `/chat/sessions/:id/messages/stream` (SSE) | ✓ | `sendChatMessageSchema` | – | `chatSessionIdSchema` | **none** | no |

Outside `/api/v1` (not covered by the global limiter, no auth — intentional):

| # | Method | Path | Notes |
|---|--------|------|-------|
| 28 | GET | `/health` | Pings DB; used by uptime monitors. Not rate-limited. |

Global limiter (baseline): 100 req / 15 min per IP on `/api`, env `RATE_LIMIT_MAX_REQUESTS`.
AI limiter (baseline): 5 req / min per IP on routes 17–18, env `AI_RATE_LIMIT_MAX`.
Chat stream (route 27) costs real money (Claude) and had **no dedicated limiter**.

### Baseline validation gaps (to-do list from the table)

- No body schema is `.strict()` → unknown fields (e.g. `role: "admin"`) are silently stripped.
- Password: min 6, no max (needs 8–72, bcrypt cap) — routes 1, 2.
- Email not normalized (`.trim().toLowerCase()`) — routes 1, 2.
- `registerSchema`/`loginSchema` and all other string fields: no `.max()` on several inputs.
- `listCampaignsSchema.search` unbounded; `limit=all` uncapped in the service (`take` omitted).
- `listPostsQuerySchema.search` unbounded.
- `bulkUpdatePostsSchema.posts` has no array `.max()`; mismatched ownership count returns 400 instead of 404.
- `generateContentSchema.tone` is an unbounded free string (needs enum); `keywords` items unbounded.
- `sendChatMessageSchema.content` max 8000 (plan: ~4000).
- ID params use `z.string().uuid()` (deprecated in zod v4; switch to `z.uuid()`).
- Routes 17–18: campaign ownership verified (already OK). Route 27: session ownership verified (already OK).
- Chat `campaignId` in body (route 22): ownership verified (already OK).

*(This table will be updated to the post-fix state as items are completed.)*

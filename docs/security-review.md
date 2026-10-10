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

---

## Findings

### 4. Client IP behind proxies (confirmed, documented — needs deploy verification)

Traffic path: browser → Next rewrite (`/api/v1/:path*` → `NEXT_PUBLIC_API_BASE_URL`) → Render
proxy → Express.

**Measured locally** (API with `DEBUG_REQUEST_IP=true`, Next 16 dev rewrite, `app.set('trust proxy', 1)`):

| Request | API `req.ip` | API `req.ips` | `x-forwarded-for` seen by API |
|---------|--------------|---------------|-------------------------------|
| curl → API directly, no XFF | `::1` | `[]` | *(none)* |
| curl → API directly, XFF `1.2.3.4` | `1.2.3.4` | `[1.2.3.4]` | `1.2.3.4` |
| curl → API directly, XFF `9.9.9.9, 8.8.8.8, 1.2.3.4` | `1.2.3.4` (rightmost) | `[1.2.3.4]` | `9.9.9.9, 8.8.8.8, 1.2.3.4` |
| curl → **web** `:3000/api/v1/...`, no XFF | `::1` | `[]` | *(none — Next did not add one)* |
| curl → **web**, client sent XFF `7.7.7.7` | `7.7.7.7` | `[7.7.7.7]` | `7.7.7.7` (**forwarded verbatim, not appended**) |

Conclusions:

1. `trust proxy = 1` means Express uses the **rightmost** `x-forwarded-for` entry.
2. The Next rewrite does **not** add the original client IP; it forwards whatever
   `x-forwarded-for` it received. A client can therefore set its own XFF and, if it can reach
   Express through only one trusted proxy, choose its own rate-limit key. On Render this is
   mitigated because Render's own edge proxy prepends/appends the address it saw, so the
   rightmost entry is the proxy's, not the client's — but that also means **all requests may
   share one bucket** (the Next/Vercel egress IP) when `trust proxy = 1`.
3. We therefore cannot guess the correct hop count; it must be measured on Render.

**How to verify on Render (temporary, removed before final commit):**

1. Set `DEBUG_REQUEST_IP=true` on the Render service and deploy.
2. Hit the API through the web app a few times from different networks:
   `curl https://<web-domain>/api/v1/auth/me`
3. Also hit the Render API URL directly once: `curl https://<api>.onrender.com/api/v1/auth/me`
4. Read the `request-ip-debug` lines in the Render logs and compare `ip`, `ips`,
   `xForwardedFor`, `xRealIp`, and `path`.

**Recommendation:** set `trust proxy` to the measured number of trusted hops so `req.ip`
is the true client IP (likely `1` if Render is the only trusted hop, `2` if Vercel also
fronts the request). Never set it to `true`. If the correct count is unstable, the robust
alternative is to have the Next rewrite set a dedicated header (e.g. `x-client-ip`) from
`request.headers.get('x-forwarded-for')`/`x-real-ip` and trust only that on the API.

Until verified, `trust proxy` stays at `1` (no guessing). The debug middleware is gated by
`DEBUG_REQUEST_IP` and is removed in the final cleanup commit; the snippet is preserved in
git history (`chore(api): add temporary client-IP debug logging for proxy verification`).

### 6. Input validation (confirmed and fixed)

- All body schemas are now `.strict()` — unknown fields (e.g. `role: "admin"`) are rejected
  with 400 instead of silently stripped. Verified: `register`, `campaign create/update`,
  `post create`, `bulk-update` (including per-item), `chat session create`, `generate`.
- Register password: `min 8`, `max 72` (bcrypt cap). Login keeps `min 1` with no max so a
  pre-existing long password still works (bcrypt truncates at 72 bytes anyway).
- Email: `.trim().toLowerCase().max(254)` on register **and** login — verified mixed-case
  register stores lowercase and mixed-case login matches.
- `listCampaignsSchema`: `page >= 1`, `limit` 1–100 or `all`, `search` max 100, `sortBy`/
  `sortOrder` enums (last two already existed). `listPostsQuerySchema.search` max 100.
- Every string field now has an explicit `.max()`; `bulkUpdatePostsSchema.posts` capped at
  200 items; `keywords` items capped at 200 chars (array max 10 already existed).
- ID params use `z.uuid()` (zod v4, replaces deprecated `z.string().uuid()`).
- AI: `tone` is now an enum — `Professional|Playful|Urgent|Friendly|Bold` (matches the web
  option set); `length` enum already existed. Regenerate uses the same field definitions as
  generate, all optional, accepts `{}` (the web's "use original parameters" call).
- Chat message content: max 8000 → 4000.
- Validation failures now return a readable message
  (`Validation failed: <first 3 issues>` + full list in `error`) instead of bare
  `Validation failed`.
- AI model/max-tokens confirmed server-env only (`config/ai.config.ts`); the strict body
  schema makes it impossible to pass them from the client.
- Collateral fix: `signupAction` was sending the whole form object, including
  `confirmPassword`, which `.strict()` would now reject — it now sends only
  `{ email, password }`.

Verified by curl against the local API (400 cases above, plus happy paths: register, login,
campaign create/update, post create, chat session create, SSE generate with mock AI).

### 7. Ownership and list limits in services (confirmed and fixed)

- `bulkUpdatePosts` now returns **404** (`One or more posts not found`) instead of 400 when
  any requested post id isn't in the campaign — consistent with the repo's owner-scoped
  404-not-403/400 invariant. The check also uses a `Set` now, so duplicate ids in one
  request no longer produce a false mismatch.
- `listCampaigns` with `limit=all` was unbounded (`take` omitted) → hard server-side cap of
  500; `pagination.limit` reports `min(total, 500)`.
- Verified by curl: ghost id in bulk → 404, duplicate real ids → 200, `limit=all` → capped.

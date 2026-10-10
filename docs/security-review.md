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

### Baseline validation gaps (all addressed — see Findings below)

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

**How to verify on Render:** the debug middleware was removed before the final commit as
planned. To run the check, first re-apply commit `72df67a`
(`chore(api): add temporary client-IP debug logging for proxy verification`) — or re-add the
gated middleware — then:

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

### 8. Session / cookies / refresh tokens (confirmed and fixed)

- Refresh tokens are now stored as a SHA-256 hash (`utils/hashToken.ts`) instead of the
  plaintext JWT; refresh compares the hash of the presented cookie. Verified against the DB:
  stored value is 64-hex, not a JWT; a garbage cookie still returns 401.
- Cookies (`accessToken`, `refreshToken`, and the logout clear) are `httpOnly`,
  `secure` in production, `path=/`, and **`SameSite=Lax`** (was `SameSite=None`). All
  browser traffic reaches the API through the same-origin Next rewrite
  (`axios.ts` uses `/api/v1` in the browser), so `Lax` is sufficient and adds CSRF
  protection that `None` did not. Applied consistently in `apps/api` and the web cookie
  writes (`auth.action.ts`, `lib/fetcher.ts`). The web now also derives `secure` from
  `NODE_ENV` instead of always `true`, so cookies work over plain http in local dev.
- **Deploy note:** existing sessions have a plaintext refresh token in the DB and will fail
  to refresh after this change (users must log in again). Optionally
  `UPDATE users SET "refreshToken" = NULL;` at deploy time to force a clean re-login.

### 9. Error responses (confirmed and fixed)

- In production, any response with status ≥ 500 is now `{ success: false, message:
  "Internal server error" }` with no `error`/details — the real error (and stack) stays in
  the winston logs only. 4xx messages and validation details are unchanged, since the client
  needs them; development still returns the raw message and details for debugging.
- Oversized bodies → 413 and malformed JSON → 400 with clean messages (see item 5).
- Verified with a handler harness: prod 500 generic, dev 500 detailed, prod 400 detailed.

### 10. Security smoke test (added)

- `scripts/security-smoke-test.sh` (`bun run security:smoke`) exercises the hardening against
  a running API with curl: health + rate-limit headers, auth validation, body-size limits
  (413/400), 401, campaign query bounds, chat/AI validation, and the 404 ownership rule.
- It logs in as the seeded demo user (`SMOKE_EMAIL`/`SMOKE_PASSWORD` overridable) and creates
  + deletes a temporary campaign so it leaves no data behind.
- Each run uses a random `X-Forwarded-For` so the auth limiter (which counts failures)
  doesn't make repeated local runs fail; behind a real edge proxy the header is replaced and
  a run may report 429 instead.
- Verified: 23/23 checks pass, three consecutive runs.

---

## Follow-ups and decisions needed

1. **`trust proxy` hop count (item 4)** — unverified until measured on Render; `1` is kept
   for now (no guessing). Risk while unverified: the client IP may resolve to the Next/Vercel
   egress, putting all users in one rate-limit bucket. Follow the verification steps above,
   then set the exact hop count; never `true`. If it's unstable, have the Next rewrite set a
   dedicated header and trust only that.
2. **Existing refresh tokens** — stored plaintext before this change, so those sessions will
   fail to refresh and users must log in again. Optional deploy step:
   `UPDATE users SET "refreshToken" = NULL;`.
3. **Email normalization** — register/login now lowercase emails. If any existing account has
   a mixed-case email, it can no longer log in. Decide between a one-time
   `UPDATE users SET email = lower(email);` or a case-insensitive login lookup.
4. **`SameSite=Lax`** — valid because all browser traffic goes through the same-origin Next
   rewrite (verified for axios and both SSE clients). If a browser is ever pointed directly at
   the API cross-site, cookies won't be sent and this must be revisited.
5. **Search length** — search strings over 100 chars now return 400; consider adding
   `maxLength` to the web search inputs so users don't hit it.
6. **Limiter keying / store** — AI generate/regenerate are per-IP (5/min), chat and the rest
   per-user/IP on top of the global limiter. The store is in-memory, so limits are per
   instance and reset on restart — fine for a single Render instance, needs Redis if scaled
   horizontally. Commented in `rateLimit.middleware.ts`.
7. **Tone enum** — canonical set is `Professional|Playful|Urgent|Friendly|Bold`; external
   consumers sending other casings now get 400.
8. **Web lint** — root `bun run lint` still fails on 5 pre-existing errors
   (`react-hooks/set-state-in-effect`, `react/no-unescaped-entities`) in untouched web files;
   left out of scope.
9. **Orphaned test** — `apps/api/src/config/db.config.test.ts` uses `node:test` with no runner
   wired; `scripts/security-smoke-test.sh` is the API behavior check instead.

## Commits on this branch

- `docs: add route inventory baseline for security review`
- `chore(api): restore ESLint flat config and fix pre-existing lint errors`
- `fix(api): validate env on startup and keep dotenv loading first`
- `fix(api): restrict CORS to an explicit origin allowlist`
- `feat(api): consolidate rate limiters and add auth/refresh/chat limiters`
- `chore(api): add temporary client-IP debug logging for proxy verification`
- `fix(api): cap body size at 100kb and return proper 413/400`
- `fix(api): harden zod schemas with strict objects, bounds and enums`
- `fix(api): 404 cross-campaign bulk updates and cap limit=all listing`
- `fix(auth): hash refresh tokens and use SameSite=Lax cookies`
- `fix(api): return generic 500s in production without internal detail`
- `test(scripts): add curl security smoke test`
- final cleanup: remove temporary client-IP debug middleware

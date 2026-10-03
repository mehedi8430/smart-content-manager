# Smart Content Manager — All Features

AI-powered content and campaign management platform. Plan content on a kanban board, generate marketing copy (ads/captions/emails) with Claude, and get campaign-aware AI chat support.

## Tech Stack & Architecture

```text
apps/web    Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui) frontend
apps/api    Express 5 + TypeScript backend, REST API
DB          PostgreSQL via Prisma 7 (pg adapter)
AI          Anthropic Claude (SSE streaming; mock mode without API key)
Monorepo    Turborepo + Bun workspaces
Runtime     Docker (multi-stage) + Docker Compose
Monitoring  Uptime Robot HTTP(s) monitor on the API /health endpoint
```

- API base: `api/v1` (web dev proxies via `proxy.ts`/axios)
- Frontend ↔ API: Server Actions (campaigns/posts/auth), axios (rest), and raw `fetch` + SSE readers (`ai-stream-client`, `chat-stream-client`)

## Data Model (Prisma)

- **User** — email, bcrypt password hash, stored refresh token
- **Campaign** — name, description, owned by User; cascade deletes Posts + AiOutputs
- **Post** — title, description, status (`todo|in_progress|done`), order (kanban position), dueDate, belongs to Campaign
- **AiOutput** — type (`ad|caption|email`), title, prompt, tone, content, model, tokensUsed, belongs to Campaign
- **ChatSession** — optional `campaignId` (null = general chat), auto/manual title; belongs to User, ordered by updatedAt
- **ChatMessage** — role (`user|assistant`), content, belongs to Session

Seed script (`prisma/seed.ts`) creates demo users (`demo@smartcontent.test`, `sarah@freelance.test`, password `Password123!`) with campaigns, posts, outputs, and chat sessions.

## 1. Authentication & Authorization

- Register, login, logout, get-me, refresh-token endpoints
- bcrypt password hashing; JWT access + refresh tokens in `httpOnly` cookies
- Refresh tokens persisted in DB, rotated/revoked on logout
- `protect` middleware guards all non-auth routes (Bearer header or cookie); ownership checks return 404 (no existence leak)
- Frontend route protection in `proxy.ts`: redirects unauthenticated `/dashboard` → `/login`, authenticated users away from `/login|/signup`; landing `/` redirects to dashboard when logged in

## 2. Dashboard

- Stat cards: active campaigns, content pieces, AI outputs, completion rate
- Recent activity feed (campaign + post updates)
- Data from one paginated campaigns query (posts included, avoiding N+1)

## 3. Campaign Management

- Full CRUD (`POST/GET/PATCH/DELETE /campaigns` + `GET /campaigns/:id`)
- Pagination, search (case-insensitive), sorting (createdAt/name, asc/desc), `limit=all`
- Per-user TTL cache (60s) with explicit invalidation on writes; counts of posts/outputs included
- UI: campaigns table with create/edit modals and delete confirmation dialog

## 4. Kanban Board (posts)

- 3 columns: todo / in_progress / done, cards ordered by `order`
- Drag & drop (dnd-kit): move between columns and reorder; optimistic UI + bulk `PATCH` sync of full board state
- Create/edit posts in a side sheet (title, description, status, dueDate), delete via confirm dialog
- Column/title search & status filter, board keyboard/touch support, skeleton loading
- "Use in Post": AI output content passed via URL param pre-fills a new post

## 5. AI Content Generation

Endpoint: `POST /campaigns/:campaignId/ai-outputs/generate`, `POST .../ai-outputs/:id/regenerate`, plus list/get/delete. Rate-limited per IP (`AI_RATE_LIMIT_MAX`, default 5 requests/minute).

- **Content types**: Ad, Caption, Email — each with a dedicated prompt builder (CTA, subject line, hashtags, platform best practices)
- **Options**: tone (Professional/Playful/Urgent/Friendly/Bold), length (Short/Medium/Long), comma-separated keywords; campaign name + description injected as context
- **SSE streaming**: Claude response streams chunk-by-chunk into the UI (with blinking-cursor indicator); client can cancel via AbortController; disconnect-safe
- Result persisted with auto-generated title (first 8 words), model, and token usage
- **Regenerate**: reruns generation on the same output (server reuses/merges original params)
- **Output history**: grouped by type; actions = copy, export as PDF (lazy-loaded jsPDF, multi-page, meta header), use in post, optimistic delete; error state with retry, empty state with CTA

## 6. AI Marketing Copilot (Chat)

Endpoint: `POST /chat/sessions/messages/stream` (SSE) + session CRUD (`sessions` list/get/patch/delete).

- Chat drawer (sidebar / campaign pages) with session list ordered most-recent-first
- **General chat** (no campaign) = generic copilot prompt
- **Campaign-scoped chat**: auto-creates/resumes a session for a campaign; system prompt injects the campaign's tasks (title, status, due) and its 5 most recent generated outputs
- User message persisted *before* streaming; assistant reply + session touch persisted in a transaction after stream ends
- Auto-derived title (first words of first message) + manual rename; delete session; retry on error; optimistic message rendering with local stash
- Accessible via global header button (general) or "ask copilot" from campaign pages

## 7. Landing & Extras

- Public landing page (hero, features, pricing, CTA, screenshots gallery), privacy + terms legal pages
- Dashboard shell: collapsible sidebar, breadcrumbs, global campaign search, light/dark/system theme toggle
- Onboarding hints (dismiss-per-hint), user menu (profile/logout), mobile-responsive UI, sonner toasts

## 8. Backend Infrastructure

- Security: helmet, CORS (configurable origins), global rate limit (100/15min) + AI generation limiter, 10MB body limit, compression
- Validation: zod schemas for all bodies/queries/params
- Logging: winston daily-rotate combined/error logs
- `/health` endpoint pings DB (see §9 for how it's monitored), structured `{success,data,message}` responses, centralized error handler, 404 handler
- Env-configurable AI (model, max tokens, mock mode when no Anthropic key)

## 9. Monitoring & Uptime

Public uptime monitor + DB-aware health endpoint, keeping the free-tier API and database from sleeping.

- **`GET /health`** — pings the database with `prisma.$queryRaw\`SELECT 1\``; returns `200 {success: true, db: "connected"}` or `503 {success: false, db: "disconnected"}` with an ISO `timestamp`. Registered in `app.ts` **before** the 404 handler — Express matches in registration order, so registering it after the catch-all makes every probe return 404.
- **Uptime Robot** HTTP(s) monitor pinging `https://smart-content-manager.onrender.com/health` every **5 minutes**, configured in the Uptime Robot dashboard (down/recovered alert channels are set there, not in this repo).
- **Why it exists:** Render's free tier sleeps after ~15 min idle and Neon's serverless Postgres auto-suspends after ~5 min — stacked, the first login after an idle period took 30–60s. The 5-min probe interval stays under both spin-down windows.
- **Superseded approach (kept as a fallback):** `.github/workflows/keep-alive.yml` pings the same endpoint on a `*/10` cron (plus `workflow_dispatch` for manual runs) using the repo variable `BACKEND_HEALTH_URL`, failing the job on any non-200. It was replaced as the *primary* monitor because GitHub's `schedule` trigger is best-effort and gets silently deprioritized under load — the workflow ran fine on demand but stopped firing on its own.
- Monitored only at the API layer: the web app is verified through its own container healthcheck rather than an external monitor.

## 10. Dockerization

Both apps build as multi-stage images and run together under Docker Compose, with no reverse proxy in front.

- **`.dockerignore`** at the root and per app — excludes `node_modules`, `.next`, `dist`, `.turbo`, `logs`, `.env*`, `.git`, so build contexts stay small and no local secrets or stale artifacts leak into images.
- **`apps/api/Dockerfile`** — 3 stages:
  - `deps` (`oven/bun:1.4.0`) — copies the root `package.json` + `bun.lock` and both app manifests, then `bun install --frozen-lockfile` (lockfile-exact installs, cached independently of source)
  - `builder` — `COPY . .` and compiles TS + generates the Prisma client against a **placeholder** `DATABASE_URL` (`prisma generate` needs a syntactically valid URL but never connects); this stage is reused as the `migrate` target because it carries the Prisma CLI and `prisma/` directory
  - `runner` (`node:24-slim`) — copies only `node_modules`, `apps/api/dist`, and the app manifest; runs as the non-root `node` user with `/app/logs` pre-created and owned so winston daily-rotate can write; `EXPOSE 3001`; `HEALTHCHECK` polls `/health` every 10s (15s start-period, 5 retries); starts with `node apps/api/dist/server.js`
- **`apps/web/Dockerfile`** — 3 stages, same `deps` base; the builder inlines `NEXT_PUBLIC_API_BASE_URL` (build arg, default `http://server:3001/api/v1`) and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` at **build time** — `NEXT_PUBLIC_*` values are baked into the client bundle and cannot be set at runtime. The runner (`node:24-slim`) ships only the standalone output (`output: "standalone"` in `next.config.ts`) plus `public/` and `.next/static`, runs as `node` with `HOSTNAME=0.0.0.0`, `EXPOSE 3000`, and a `HEALTHCHECK` that hits `/login` — a public route, so the probe isn't blocked by an auth redirect.
- **Container networking keeps auth same-origin:** browser requests use the relative `/api/v1/...` path; the Next server rewrites it to the API container over the Compose network. Cookies stay same-origin, so the `httpOnly` auth model works unchanged without CORS exceptions in the browser.

### `docker-compose.yml`

Project `smart-content-manager`, `init: true`, `restart: unless-stopped`, and a shared `json-file` logging anchor (10 MB × 3 rotations) on every long-running service.

| Service | Role | Notes |
|---|---|---|
| `server` | API (`runner` target) | `env_file: ./apps/api/.env`; overrides `NODE_ENV=production`, `PORT=3001`, `CORS_ORIGIN=http://localhost:3000`; publishes `3001`; named volume `api-logs:/app/logs` so rotating logs survive container restarts |
| `client` | Web (`runner` target) | passes both build args; re-supplies `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` at **runtime** as well (Server Actions decrypt it per-request); publishes `3000`; `depends_on: server {condition: service_healthy}` so the API's `HEALTHCHECK` gates web startup |
| `migrate` | One-off schema runner | `profiles: ["tools"]` — never started by `up`; built from the `builder` target for the Prisma CLI, `working_dir: /app/apps/api`, `command: bun x prisma migrate deploy`, `restart: "no"` |

- **No database service in Compose** — `DATABASE_URL` comes from `apps/api/.env` and points at the externally hosted Postgres. The stack is self-contained for the app tier only.
- Apply migrations explicitly with `docker compose run --rm migrate` before `docker compose up --build`.

## Deployment

Two supported targets:

- **Production (hosted):** API on Render behind `https://smart-content-manager.onrender.com`; build = `prisma generate && tsc && tsc-alias`, prod start runs `prisma migrate deploy`. Web uses `NEXT_PUBLIC_API_BASE_URL` + `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.
- **Self-hosted / local parity:** `docker compose up --build` brings up both containers; mirror the prod env in `apps/api/.env` and the root `.env` (the Compose file fails fast if `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is missing — generate with `openssl rand -base64 32`).
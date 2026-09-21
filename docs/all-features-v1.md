# Smart Content Manager — All Features

AI-powered content and campaign management platform. Plan content on a kanban board, generate marketing copy (ads/captions/emails) with Claude, and get campaign-aware AI chat support.

## Tech Stack & Architecture

```text
apps/web    Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui) frontend
apps/api    Express 5 + TypeScript backend, REST API
DB          PostgreSQL via Prisma 7 (pg adapter)
AI          Anthropic Claude (SSE streaming; mock mode without API key)
Monorepo    Turborepo + Bun workspaces
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

Endpoint: `POST /campaigns/:campaignId/ai-outputs/generate`, `POST .../ai-outputs/:id/regenerate`, plus list/get/delete. Rate-limited (5/min).

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
- `/health` endpoint pings DB (keep-alive for uptime monitors / cold-start avoidance), structured `{success,data,message}` responses, centralized error handler, 404 handler
- Env-configurable AI (model, max tokens, mock mode when no Anthropic key)

## Deployment

- API deployed on Render behind `https://smart-content-manager.onrender.com`; build = `prisma generate && tsc && tsc-alias`, prod start runs `prisma migrate deploy`
- Web uses `NEXT_PUBLIC_API_BASE_URL` + `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
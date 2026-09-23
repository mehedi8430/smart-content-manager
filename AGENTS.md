<!-- BEGIN:smart-content-manager-root -->
# Smart Content Manager — Monorepo

AI-powered content and campaign management platform. Small businesses / solo marketers / freelancers go from brief to publishable content by combining a kanban workflow with an Anthropic Claude–backed content studio and a campaign-aware marketing copilot.

Full context: `docs/project-brief.md` (or wherever the project brief lives in-repo) for product scope, milestones, and success criteria.

## Repo layout

```text
apps/web    Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui) frontend
apps/api    Express 5 + TypeScript backend, REST API under /api/v1
```

- Turborepo + Bun workspaces. No shared `packages/` yet — if you add one (e.g. shared types/zod schemas), document it here.
- **Read the package-level file for the area you're touching:**
  - Frontend work (Next.js, React, UI, Server Actions, SSE clients) → `apps/web/agents.md`
  - Backend work (Express, Prisma, routes, middleware, SSE endpoints) → `apps/api/agents.md`
  - This file covers what's true across both, or what you need to know before picking a package.

- Before making any change in `apps/web`, open and follow `apps/web/agents.md`.
- Before making any change in `apps/api`, open and follow `apps/api/agents.md`.

## Commands

Run from the repo root using Turborepo, not by `cd`-ing into a package:

```bash
bun run dev              # both apps
bun run build            # both apps, respects build dependency order
bun run dev --filter=web
bun run dev --filter=api
```

Prisma commands (`generate`, `migrate dev`, `db seed`) run from `apps/api`, since that's where `schema.prisma` and `prisma/seed.ts` live — don't add a duplicate Prisma setup under `apps/web`.

## Source of truth: the Prisma schema

`apps/api/prisma/schema.prisma` is the single source of truth for data shapes — `User`, `Campaign`, `Post`, `AiOutput`, `ChatSession`, `ChatMessage`. Frontend types/interfaces must mirror this, not redefine it independently. When a field changes on the API side, treat frontend type drift as a bug, not a separate concern.

## Cross-cutting conventions (apply to both apps)

- **API response shape**: every API response is `{ success: boolean, message?: string, data?: ... }`, including errors. Frontend code (axios layer, Server Actions, SSE parsers) should assume this shape uniformly.
- **Ownership → 404, not 403**: resources the current user doesn't own return 404 (no existence leak). This is intentional on the API side; the frontend should treat 404 on owner-scoped resources as "not accessible," not "definitely doesn't exist anywhere."
- **Auth**: JWT access + refresh tokens as `httpOnly` cookies. Never introduce client-side token storage/reading — this breaks the security model both apps rely on.
- **SSE streaming endpoints** — these are the two places both apps must stay in sync on framing/disconnect behavior:
  - `POST /campaigns/:campaignId/ai-outputs/generate` (+ `/regenerate`)
  - `POST /chat/sessions/messages/stream`
  Both are cancelable via `AbortController` on the client and disconnect-safe on the server (no partial/corrupt persisted state). If you change the chunk framing or event format on one side, update the corresponding client/parser on the other.
- **Env vars split by app, not shared**: `NEXT_PUBLIC_API_BASE_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` belong to `apps/web`; DB/JWT/Anthropic/rate-limit vars belong to `apps/api`. Don't consolidate into a single root `.env` — each app loads its own.

## Deployment

- `apps/api` → Render, behind `https://smart-content-manager.onrender.com`. Build: `prisma generate && tsc && tsc-alias`. Prod start runs `prisma migrate deploy` automatically.
- `apps/web` → connects via `NEXT_PUBLIC_API_BASE_URL` pointed at the Render URL above.
- Changing the API's deployed URL means updating `apps/web`'s env config — these aren't auto-synced.

## Roadmap / out of scope

| Phase | Scope | Status |
|---|---|---|
| 1 — Foundation | Auth, user management, campaign CRUD | ✅ Done |
| 2 — AI Content | AI generation, output/history management | ✅ Done |
| 3 — Productivity | Marketing copilot chat, kanban board, PDF export, UX polish | ✅ Done |
| 4 — Growth | Subscriptions, team collaboration, analytics, integrations | 🚧 Planned |

Phase 4 items (subscriptions, team collaboration, analytics, third-party integrations) are **not implemented**. Don't scaffold routes, middleware, UI, or DB schema for them speculatively — ask first if a task seems to assume they exist.
<!-- END:smart-content-manager-root -->
<!-- BEGIN:smart-content-manager-root -->
# Smart Content Manager

AI content and campaign management platform: brief → publishable content via a kanban workflow, a Claude-backed content studio, and a campaign-aware marketing copilot.

Product scope, roadmap, and what's explicitly out of scope: `docs/project-brief.md`.

## Packages

```text
apps/web    Next.js 16 (App Router, React 19, Tailwind 4, shadcn/ui) frontend
apps/api    Express 5 + TypeScript REST API under /api/v1
apps/e2e    Playwright browser tests
```

Bun + Turborepo workspaces. There is no shared `packages/` — if you add one, document it here.

## Commands

Run from the repo root, not from inside a package:

```bash
bun run dev              # both apps
bun run build            # both apps, respects build dependency order
bun run lint
bun run dev --filter=web # or --filter=api
```

Prisma commands (`generate`, `migrate dev`, `db seed`) run from `apps/api`, where `schema.prisma` and the seed script live.

E2E runs against an isolated Docker stack with mock AI mode:

```bash
bun run e2e:up
bun run --cwd apps/e2e test
bun run e2e:down
```

## Before you edit

- `apps/web` → read `apps/web/AGENTS.md`
- `apps/api` → read `apps/api/AGENTS.md`
- Data shapes come from `apps/api/prisma/schema.prisma`. Frontend types mirror it rather than redefining it; type drift is a bug.
- How to work in this repo (think before coding, simplicity, surgical changes, verify) → `GUIDE_AGENTs.md`

## Invariants across both apps

- Every API response is `{ success, message?, data? }`, errors included. The axios layer, Server Actions, and SSE parsers all assume it.
- Owner-scoped resources the caller doesn't own return 404, not 403. The frontend should read that as "not accessible."
- Auth tokens live in `httpOnly` cookies. Never read or write them from client code.
- The two SSE streaming endpoints must stay in sync on framing and disconnect behavior: persist only after the stream completes, never incrementally, on either side. If you change the event format on one side, update the client parser on the other.
- Env vars are per app, not shared: `NEXT_PUBLIC_*` belongs to `apps/web`, DB/JWT/Anthropic/rate-limit vars to `apps/api`. Don't consolidate them into a root `.env`.

`apps/api` deploys to Render; its prod start runs `prisma migrate deploy` automatically.
<!-- END:smart-content-manager-root -->

<!-- BEGIN:smart-content-manager-root -->
# Smart Content Manager

Monorepo for the Smart Content Manager v1: a Next.js app, Express API, and Playwright E2E suite.

```text
apps/web  Next.js 16 / React 19 frontend
apps/api  Express 5 / TypeScript API; Prisma + PostgreSQL
apps/e2e  Playwright browser tests
```

Use Bun 1.4 and Turborepo workspaces. No shared package currently exists.

## Before editing

- Read `apps/web/AGENTS.md` for frontend changes and `apps/api/AGENTS.md` for API changes.
- `apps/api/prisma/schema.prisma` is the data-model source of truth; keep frontend types aligned.
- Product scope and roadmap: [docs/project-brief.md](./docs/project-brief.md).

## Implementation practices

- Understand the existing pattern and relevant callers before changing code. State material assumptions; ask when ambiguity changes behavior or scope.
- Prefer the simplest complete solution. Avoid speculative features, unnecessary abstractions, unrelated refactors, or cleanup.
- Keep changes surgical and consistent with repository conventions. Every changed line should serve the request or fix an issue introduced by the change.
- Define how the requested behavior will be verified before implementation. Add or update focused tests for behavior changes and run the smallest relevant checks, escalating only when needed.
- Preserve existing behavior outside the requested scope. Report unrelated issues rather than changing them.

## Commands

Run workspace commands from the repository root:

```bash
bun install --frozen-lockfile
bun run dev
bun run build
bun run lint
```

Run Prisma commands from `apps/api`. E2E runs against its isolated Docker stack:

```bash
bun run e2e:up
PLAYWRIGHT_BASE_URL=http://localhost:3002 bun run --cwd apps/e2e test
bun run e2e:down
```

## Invariants across both apps

- API JSON responses use `{ success, message?, data? }`, including errors.
- Owner-scoped resources return 404 when inaccessible; preserve this behavior.
- Auth tokens are `httpOnly` cookies; never read or write them in client code.
- Keep the AI-generation and chat SSE server/client framing and disconnect handling in sync. Persist streamed results only after completion.
- Keep environment variables with their owning app (`NEXT_PUBLIC_*` in web; database, JWT, AI, and rate-limit settings in API). Root `.env` is only for Docker Compose interpolation, not shared app configuration.
<!-- END:smart-content-manager-root -->

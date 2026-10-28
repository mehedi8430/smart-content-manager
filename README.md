# Smart Content Manager

An AI-assisted campaign and content workspace for small businesses and marketers. Plan work on a kanban board, generate campaign-aware marketing copy, and get help from a marketing copilot.

## v1 scope

- Email/password authentication with protected user sessions
- Campaign management and a three-stage content board
- Streamed AI generation for ads, social captions, and emails
- General and campaign-aware AI chat
- Dashboard, public landing page, and privacy/terms pages

Subscriptions, team collaboration, analytics, and third-party integrations are planned, not part of v1. See [docs/project-brief.md](./docs/project-brief.md) for the product brief and [docs/all-features-v1.md](./docs/all-features-v1.md) for the feature inventory.

## Stack and layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js 16, React 19, Tailwind CSS 4 |
| `apps/api` | Express 5 + TypeScript REST API, Prisma, PostgreSQL |
| `apps/e2e` | Playwright browser tests |

Bun workspaces and Turborepo manage the monorepo. The API is under `/api/v1`; the API health endpoint is `/health`.

## Requirements

- Bun 1.4.0 (see `package.json`)
- PostgreSQL for host-based development, or Docker Engine with Compose v2
- Node.js 24 is used by the production Docker images

## Local development

Install dependencies and create app-specific environment files:

```bash
bun install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Configure `apps/api/.env` with a PostgreSQL `DATABASE_URL`, unique strong `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`, and `CORS_ORIGIN=http://localhost:3000`. For real AI responses, configure an Anthropic API key; without one the API supports its mock mode.

In `apps/web/.env`, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`. Set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to a stable base64-encoded 32-byte key, for example the output of `openssl rand -base64 32`. Do not commit populated `.env` files.

Apply database migrations and start both apps:

```bash
cd apps/api && bun run db:migrate
cd ../..
bun run dev
```

Open Prisma Studio against the configured API database with:

```bash
bun run db:studio
```

| Service | Local URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| API health | http://localhost:8000/health |

## Docker Compose

The root Compose stack starts a local PostgreSQL database, applies migrations automatically, then starts the API and web app. The web app runs Next.js in development mode and mounts its source, so edits under `apps/web/src` appear through hot reload without rebuilding the image. Changes to dependencies or Docker configuration still require a rebuild. The API database URL is overridden to use the Compose database; it does not use the host development database URL.

Create the API env file and set unique strong `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` values in it. Compose supplies the local database URL and web origin for this stack. Generate a server-actions key once and keep it stable across restarts. For repeat runs, store it in an untracked root `.env` as `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<generated-value>`; exporting it is suitable for a one-off run:

```bash
cp apps/api/.env.example apps/api/.env
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"
docker compose up --build
```

After the initial startup, run `docker compose up -d` as needed; edits to the mounted web source are picked up automatically. Use `docker compose up --build -d client` after changing dependencies or the Dockerfile.

For this Compose stack, the database is exposed on host port `5433`, the API on `3001`, and the web app on `3000`. The server-actions encryption key is needed at build and runtime and must remain stable across rebuilds/instances. Other app configuration belongs in the relevant app's environment file; the root `.env` is only used for Compose variable interpolation.

On the first `docker compose up`, Compose applies migrations and then seeds the empty local database with demo data before starting the API. Demo login: `demo@smartcontent.test` or `sarah@freelance.test`; password: `Password123!`. On later starts, the seed step skips databases that already contain users, so it will not overwrite local work. The explicit `bun run db:seed` command in `apps/api` remains destructive and clears existing rows.

`docker compose down` stops the stack but preserves its database volume. **`docker compose down -v` deletes that local database volume.** The next `docker compose up` then creates a fresh database and seeds it again.

## E2E tests

The Playwright suite starts an isolated Compose stack with mock AI mode. It uses port `3002` for the web app and a separate database volume:

```bash
bun run e2e:up
PLAYWRIGHT_BASE_URL=http://localhost:3002 bun run --cwd apps/e2e test
bun run e2e:down
```

Run `bun run e2e:down` after the test even when the test command fails; it removes the E2E database volume.

## Before a v1 release

- Set production-only database credentials, unique access/refresh JWT secrets, and an exact `CORS_ORIGIN` allowlist; use HTTPS.
- Set the web app's `NEXT_PUBLIC_API_BASE_URL` to the production API before building the web bundle. Keep one stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` across all web instances and releases.
- Configure the production Anthropic key if live generation/chat is required; otherwise confirm mock mode is not exposed as a production experience.
- Verify migrations against a production-like database and confirm backups and restore procedures before launch.
- Resolve the known v1 review issues documented in [docs/all-features-v1.md](./docs/all-features-v1.md) and add regression coverage for those flows.
- Run `bun run lint`, `bun run build`, and the E2E suite; smoke-test registration, login, campaign CRUD, board changes, streaming/disconnect behavior, and `/health`.
- Review the privacy/terms content, user-data handling, monitoring/alerting, and support/contact details before opening registration publicly.

The GitHub E2E workflow runs on pull requests and pushes to `main`. The delivery workflow builds and pushes Docker images on `main`; it does not itself deploy them. Configure deployment and production secrets/variables in the hosting platform separately.

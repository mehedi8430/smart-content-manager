# API

Express 5 + TypeScript REST API for Smart Content Manager, backed by PostgreSQL and Prisma. For monorepo setup, Docker Compose, E2E tests, and v1 release preparation, see the [root README](../../README.md).

## Local development

From the repository root, install dependencies and create `apps/api/.env` from `.env.example`. Configure a PostgreSQL `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, and `CORS_ORIGIN`. Add an Anthropic API key to use live AI rather than mock mode.

```bash
cd apps/api
bun run db:migrate
bun run dev
```

The API listens on the configured `PORT` (8000 in `.env.example`) and serves versioned routes under `/api/v1`. `GET /health` reports API/database health.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the API with Bun watch mode |
| `bun run build` | Generate Prisma client and compile TypeScript |
| `bun run start` | Start the built API without applying migrations |
| `bun run start:prod` | Apply deployed migrations, then start the API |
| `bun run lint` | Run ESLint |
| `bun run type-check` | Run TypeScript without emitting files |
| `bun run db:migrate` | Create/apply a development migration |
| `bun run db:deploy` | Apply committed migrations |
| `bun run db:seed` | Seed the configured database; use only for disposable development data |

See [apps/api/AGENTS.md](./AGENTS.md) for API architecture and conventions.

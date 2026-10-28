# Web application

Next.js 16 / React 19 frontend for Smart Content Manager. For monorepo setup, Docker Compose, E2E tests, and v1 release preparation, see the [root README](../../README.md).

## Local development

From the repository root, install dependencies and configure `apps/web/.env` using `.env.example`. Set:

- `NEXT_PUBLIC_API_BASE_URL` to the API origin and `/api/v1` path (local default: `http://localhost:8000/api/v1`)
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to a stable base64-encoded AES key; use the same key for all instances of a deployment

Start the API and its PostgreSQL database first, then run:

```bash
cd apps/web
bun run dev
```

The web app listens on http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Next.js in development mode |
| `bun run build` | Create the production build |
| `bun run start` | Serve the production build |
| `bun run lint` | Run ESLint |

See [apps/web/AGENTS.md](./AGENTS.md) for frontend architecture and conventions.

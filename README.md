# Smart Content Manager

AI-powered content and campaign management platform.

## Tech Stack

* Next.js
* Express.js
* PostgreSQL
* Prisma
* TypeScript
* Docker (Compose v2)

## Prerequisites

For local development:

- Node.js 22+
- Bun
- PostgreSQL

For Docker Compose:

- Docker Engine with the Compose v2 plugin (`docker compose`)
- No external database is needed: Compose starts its own PostgreSQL container for the app

## Project Structure

```text
apps/
├── web      # Frontend (Next.js)
└── api      # Backend (Express)
```

## Getting Started

### Install dependencies

```bash
bun install
```

## Configure environment variables

Create:

- `apps/web/.env`
- `apps/api/.env`

See `.env.example` files for required variables.

### Run Prisma migrations

```bash
cd apps/api
bunx --bun prisma migrate dev
```

### Start development servers

```bash
bun run dev
```

Starts both:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Run with Docker Compose

The Compose stack runs its own PostgreSQL container (`db`), so it never touches
the hosted Neon database. `bun run dev` on the host is unchanged and still uses
whatever `DATABASE_URL` is in `apps/api/.env`.

Copy the env examples and fill in the secrets (`DATABASE_URL` can stay as-is —
Compose overrides it for the containers):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Also export a `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` in the shell (or set it in a root `.env`):

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Build and start (migrations run automatically before the API starts):

```bash
docker compose build
docker compose up
```

| Service | Address |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |
| PostgreSQL | `postgresql://postgres:postgres@localhost:5433/smart_content_manager` |

The database is stored in the `postgres-data` volume, so data survives
`docker compose down`. To start from an empty database:

```bash
docker compose down -v
```

To re-apply migrations manually:

```bash
docker compose run --rm migrate
```

Seed data is not loaded automatically (the seed script wipes existing rows). If
you want the demo accounts in the local database, run:

```bash
docker compose run --rm --entrypoint bun migrate run prisma/seed.ts
```

```mermaid
flowchart TD
    A["Prepare environment variables"] --> B["Build API image"]
    A --> C["Build frontend image"]
    B --> M["Start Postgres + apply migrations"]
    M --> D["Start API container"]
    D --> E["API health check"]
    E --> F{"Healthy?"}
    F -->|Yes| G["Start Next.js container"]
    F -->|No| H["Frontend startup waits"]
    G --> I["Access localhost:3000"]
```

## Build

```bash
bun run build
```

## Monorepo Tooling

- **Turborepo** (build system) orchestrates and optimizes tasks across applications.
- **Bun** powers the backend runtime and Prisma commands and package manager for frontend.
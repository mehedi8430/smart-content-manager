# Smart Content Manager

AI-powered content and campaign management platform.

## Tech Stack

* Next.js
* Express.js
* PostgreSQL
* Prisma
* TypeScript

## Prerequisites

- Node.js 22+
- Bun
- PostgreSQL

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

## Build

```bash
bun run build
```

## Monorepo Tooling

- **Turborepo** (build system) orchestrates and optimizes tasks across applications.
- **Bun** powers the backend runtime and Prisma commands and package manager for frontend.
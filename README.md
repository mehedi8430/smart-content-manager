# Content Campaign AI — Backend

REST API for the Smart Content and Campaign Manager. Built with Express, TypeScript, Prisma, and PostgreSQL.

## Stack

- **Runtime:** [Bun](https://bun.com)
- **Framework:** Express 5
- **Database:** PostgreSQL + Prisma
- **Auth:** JWT

## Prerequisites

- Bun 1.2+
- PostgreSQL

## Setup

```bash
bun install
cp .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env`, then apply migrations:

```bash
bunx prisma migrate deploy
bunx prisma generate
```

## Development

```bash
bun run dev
```

Server runs at `http://localhost:3000`. API base path: `/api/v1`.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start with hot reload |
| `bun run build` | Compile TypeScript |
| `bun run start:prod` | Run production build |
| `bun run lint` | Lint source |
| `bun run type-check` | TypeScript check |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |

## Docker

```bash
docker build -t content-campaign-ai-backend .
docker run -p 3000:3000 --env-file .env content-campaign-ai-backend
```

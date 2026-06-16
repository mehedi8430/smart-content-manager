# ---------- Base ----------
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# ---------- Dependencies ----------
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile

# ---------- Builder ----------
FROM deps AS builder

WORKDIR /app

COPY . .

# Generate Prisma client (with placeholder DATABASE_URL for build)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm --filter smart-content-manager-backend exec prisma generate

# Build backend
RUN pnpm --filter smart-content-manager-backend build

# ---------- Production ----------
FROM node:22-alpine AS runner

ENV NODE_ENV=production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# install production dependencies only
RUN pnpm install --prod --filter smart-content-manager-backend

# copy compiled application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# copy prisma schema
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["node", "dist/server.js"]
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
# syntax=docker/dockerfile:1.7

# ---- Stage 1: deps ----
# install the locked Bun workspace dependencies ----
FROM oven/bun:1.4.0 AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN bun install --frozen-lockfile

# ---- Stage 2: builder ----
# compile TS + generate Prisma client ----
# Also used as the "migrate" target (contains the Prisma CLI + prisma/ dir)
FROM deps AS builder

COPY . .

ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -f /run/secrets/sentry_auth_token ]; then export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; fi && \
    export SENTRY_ORG SENTRY_PROJECT SENTRY_RELEASE && \
    cd apps/api && DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder bun run build

# ---- Stage 3: runner ----
# Node.js runtime image ----
FROM node:24-slim AS runner

ARG SENTRY_RELEASE
ENV NODE_ENV=production
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json

# winston daily-rotate writes here; must be writable by the non-root user
RUN mkdir -p /app/logs && chown node:node /app/logs

USER node
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "--import", "./apps/api/dist/instrument.js", "apps/api/dist/server.js"]







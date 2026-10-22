# syntax=docker/dockerfile:1.7

# Stage 1: deps ----
# Install the locked Bun workspace dependencies.
FROM oven/bun:1.4.0 AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN bun install --frozen-lockfile

# Stage 2: builder ----
# Build the Next.js app and generate its standalone output.
FROM deps AS builder

WORKDIR /app

COPY . .

# Inlined at build time: also used by next.config.ts rewrites (container-to-container URL)
ARG NEXT_PUBLIC_API_BASE_URL=http://server:3001/api/v1
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_ENVIRONMENT=production
ARG NEXT_PUBLIC_SENTRY_RELEASE
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT} \
    NEXT_PUBLIC_SENTRY_RELEASE=${NEXT_PUBLIC_SENTRY_RELEASE} \
    SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT} \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY} \
    NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -f /run/secrets/sentry_auth_token ]; then export SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)"; fi && \
    cd apps/web && bun run build

# Stage 3: runner ----
# Run the minimal standalone Next.js server image.
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]



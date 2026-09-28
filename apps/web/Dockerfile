# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined at build time: also used by next.config.ts rewrites (container-to-container URL)
ARG NEXT_PUBLIC_API_BASE_URL=http://server:3001/api/v1
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY} \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

# old setup
# # --- Stage 1: Build the Next.js application ---
# FROM node:24-alpine AS builder

# WORKDIR /app

# COPY package*.json ./

# RUN npm install && npm rebuild esbuild

# COPY . .

# ARG NEXT_PUBLIC_API_BASE_URL=http://server:3001/api/v1
# ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# RUN npm run build

# # --- Stage 2: Run the standalone Next.js server ---
# FROM node:24-alpine AS runner

# WORKDIR /app

# ENV NODE_ENV=production
# ENV HOSTNAME=0.0.0.0
# ENV PORT=3000

# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static

# EXPOSE 3000

# CMD ["node", "server.js"]


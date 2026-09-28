# syntax=docker/dockerfile:1.7

# ---- deps: full install (dev deps needed to build) ----
FROM node:24-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

# ---- builder: compile TS + generate Prisma client ----
# Also used as the "migrate" target (contains the Prisma CLI + prisma/ dir)
FROM deps AS builder

COPY . .

RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder npm run build

# ---- prod-deps: runtime dependencies only ----
FROM node:24-slim AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- runner: minimal runtime image ----
FROM node:24-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# generated Prisma client (lives outside package.json's dependency tree)
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

# winston daily-rotate writes here; must be writable by the non-root user
RUN mkdir -p /app/logs && chown node:node /app/logs

USER node
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]







# old setup
# FROM node:24-slim

# RUN apt-get update && apt-get upgrade -y && apt-get clean

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder npm run build

# EXPOSE 3001

# CMD ["node", "dist/server.js"]
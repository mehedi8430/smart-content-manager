FROM node:22-alpine

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# Application directory
WORKDIR /app

# Copy entire monorepo
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Placeholder DATABASE_URL for Prisma generate during build
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma client
RUN pnpm --filter smart-content-manager-backend exec prisma generate

# Build backend
RUN pnpm --filter smart-content-manager-backend build

# Go into api folder
WORKDIR /app/apps/api

# Railway uses PORT automatically
EXPOSE 8080

# Start application
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/server.js"]
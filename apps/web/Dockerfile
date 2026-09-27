# --- Stage 1: Build the Next.js application ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm rebuild esbuild

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=http://server:3001/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm run build

# --- Stage 2: Run the standalone Next.js server ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]


FROM node:22-alpine

WORKDIR /app

COPY . .

RUN corepack enable

RUN corepack prepare pnpm@latest --activate

RUN pnpm install

RUN pnpm exec prisma generate

RUN pnpm build

EXPOSE 8080

CMD ["pnpm", "start"]
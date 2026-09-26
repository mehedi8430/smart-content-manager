# --- Stage 1: Build the Next.js application ---
FROM node:24-alpine AS  builder

WORKDIR /app

COPY package*.json ./

RUN npm install && npm rebuild esbuild

COPY . .

RUN npm run build # /app/.next

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

COPY --from=builder /app/.next /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]


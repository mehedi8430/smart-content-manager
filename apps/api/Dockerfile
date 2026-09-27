FROM node:24-slim

RUN apt-get update && apt-get upgrade -y && apt-get clean

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
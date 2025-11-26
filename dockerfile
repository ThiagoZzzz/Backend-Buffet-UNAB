# Stage 1: build.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
# En lugar de ejecutar el servidor, solo construimos si hace falta
RUN npm run build || echo "No build script, skipping"

# Stage 2: runtime.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --production

COPY . .

ENV PORT=3000
EXPOSE 3000

# El servidor se levanta cuando el contenedor arranca.
CMD ["node", "server.js"]
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage: serve static + API via Node (Vercel dev sim)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY api ./api

# Servir estáticos y proxy API (desarrollo local)
ENV NODE_ENV=production
ENV PORT=3000

# Usar vercel CLI para servir (opcional) o servidor estático + funciones
# Opción simple: sirve estáticos y no ejecuta serverless; para API en local usar docker-compose con vercel dev
COPY server.js ./

EXPOSE 3000
CMD ["node", "server.js"]

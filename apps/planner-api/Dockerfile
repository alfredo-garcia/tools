# planner-api — imagen para Google Cloud Run
# Build desde repo: docker build -f apps/planner-api/Dockerfile -t planner-api ./apps

FROM node:20-alpine

WORKDIR /app

# Dependencia local: planner-db (debe existir en el contexto de build)
COPY planner-db /app/planner-db
COPY planner-api/package.json planner-api/package-lock.json /app/planner-api/

WORKDIR /app/planner-api
RUN npm ci --omit=dev

COPY planner-api/src /app/planner-api/src

# Cloud Run inyecta PORT (por defecto 8080); la API ya escucha en 0.0.0.0
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/main.js"]

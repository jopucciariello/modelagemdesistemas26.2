# GearLog — production image for Fly.io (ADR-004). SQLite lives on a Fly volume at /data.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx next build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Apply pending migrations to the volume database, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 3000"]

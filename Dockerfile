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
# Infisical CLI: secrets are pulled from Infisical at boot (ADR-003).
RUN npm install -g @infisical/cli@0.45.6 && infisical --version
COPY --from=build /app ./
EXPOSE 3000
# Log in to Infisical, then run migrations on the volume database and start the server.
CMD ["./docker-entrypoint.sh"]

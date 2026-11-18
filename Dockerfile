# GearLog — production image for Fly.io (ADR-004). SQLite lives on a Fly volume at /data.
# Expo web build (ADR-010, #67): static export served by the Next server under /app.
FROM node:22-bookworm-slim AS expo-web
WORKDIR /app-expo
COPY app-expo/package.json app-expo/package-lock.json ./
RUN npm ci
COPY app-expo ./
# Same origin as the API; only a public URL, never a secret.
ENV EXPO_PUBLIC_API_URL=https://gearlog.jopucci.com
RUN npx expo export -p web --output-dir dist

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
COPY --from=expo-web /app-expo/dist ./public/app
RUN npx next build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Apply pending migrations (recovering from a recorded failure), then start the server.
CMD ["sh", "scripts/start.sh"]

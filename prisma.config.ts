// Secrets and DATABASE_URL are injected by Infisical (ADR-003): `infisical run --env=dev -- prisma ...`.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

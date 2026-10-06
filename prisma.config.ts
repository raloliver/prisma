import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // main entry for the schema
  schema: "prisma/schema.prisma",

  // where migrations are generated; `seed` replaces the old package.json#prisma.seed
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  // Prisma 7 reads the connection URL here rather than from schema.prisma.
  // `env()` throws if DATABASE_URL is missing, which is deliberate: a wrong or
  // silent fallback could point migrations at the wrong database. The dotenv
  // import above is still required — `env()` does not load .env for you.
  datasource: {
    url: env("DATABASE_URL"),
  },
});
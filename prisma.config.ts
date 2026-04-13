import { defineConfig } from "prisma/config";

/**
 * Prisma CLI (migrate, db push, introspect) uses `datasource.url` here only.
 * Use a direct Postgres URL for DDL (Supabase session mode on :5432, or dedicated "direct").
 * PgBouncer transaction pooler (:6543) can hang or fail migrations — use DIRECT_URL when available.
 *
 * Runtime app: `src/lib/prisma.ts` uses `process.env.DATABASE_URL` (pooler URL is OK for API routes).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});

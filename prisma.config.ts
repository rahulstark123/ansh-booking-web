import { defineConfig } from "prisma/config";

/**
 * Prisma CLI (migrate, db push, introspect) uses `datasource.url` here only.
 * Prefer Supabase `DIRECT_URL`: same pooler host as DATABASE_URL but port **5432** (session mode)
 * for DDL. Transaction pooler **6543** + `pgbouncer=true` can hang or fail migrations.
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

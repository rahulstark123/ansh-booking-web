-- Run in Supabase: SQL Editor → New query → Run
-- Creates enum + user_profiles for Prisma (safe to re-run)
--
-- From a terminal (when your network can reach Supabase), prefer:
--   DIRECT_URL=...direct postgres... npm run db:migrate
-- See docs/prisma-supabase.md and prisma.config.ts (CLI uses DIRECT_URL || DATABASE_URL).

DO $$
BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "plan" "Plan" NOT NULL DEFAULT 'FREE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_email_key" ON "user_profiles" ("email");

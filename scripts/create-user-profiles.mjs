/**
 * Creates `Plan` enum + `user_profiles` in Postgres (Supabase).
 * Run from your laptop (must reach Supabase):
 *
 *   node scripts/create-user-profiles.mjs
 *
 * Uses DIRECT_URL from .env.local, else DATABASE_URL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvLocal() {
  const p = path.join(root, ".env.local");
  if (!fs.existsSync(p)) {
    console.error("Missing .env.local — add DIRECT_URL or DATABASE_URL.");
    process.exit(1);
  }
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DIRECT_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

const isSupabase =
  connectionString.includes("supabase.co") || connectionString.includes("supabase.com");
// Strip sslmode from URL so `pg` uses our `ssl` object (URL sslmode can force verify-full and break on Supabase chain).
const cleanedUrl = isSupabase
  ? connectionString.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/\?&/, "?").replace(/[?&]$/, "")
  : connectionString;
const pool = new pg.Pool({
  connectionString: cleanedUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});

const steps = [
  `DO $$
BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;`,
  `CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "plan" "Plan" NOT NULL DEFAULT 'FREE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_email_key" ON "user_profiles" ("email");`,
];

try {
  for (const sql of steps) {
    await pool.query(sql);
  }
  console.log("OK: user_profiles + Plan enum are ready.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await pool.end();
}

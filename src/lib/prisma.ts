import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

/**
 * Supabase transaction pooler (6543) + `pgbouncer=true` is tuned for Prisma’s classic query engine.
 * `@prisma/adapter-pg` talks to `node-pg` directly and often fails against transaction mode;
 * session pooler / direct Postgres (same host, port 5432) is what `DIRECT_URL` uses — use it at
 * runtime when both URLs are set.
 */
function resolveRuntimeDatabaseUrl(): string | undefined {
  const override = process.env.PRISMA_RUNTIME_DATABASE_URL?.trim();
  if (override) return override;

  const pooled = process.env.DATABASE_URL?.trim();
  const direct = process.env.DIRECT_URL?.trim();
  if (pooled && direct) {
    const m = pooled.match(/:(\d+)(?:\/|\?|$)/);
    if (m && m[1] === "6543") return direct;
  }
  return pooled || direct;
}

/** Pooler uses *.pooler.supabase.com — not *.supabase.co */
function isSupabaseConnection(url: string): boolean {
  return (
    url.includes("supabase.co") ||
    url.includes("supabase.com") ||
    url.includes("supabase.io")
  );
}

/** `sslmode=require` in the URL can force strict verify; strip and use explicit `ssl` below. */
function prepareConnectionString(url: string): string {
  if (!isSupabaseConnection(url)) return url;
  return url
    .replace(/([?&])sslmode=[^&]*/gi, "$1")
    .replace(/\?&/g, "?")
    .replace(/\?$/g, "")
    .replace(/&$/g, "");
}

function buildPrismaClient(): PrismaClient | null {
  const raw = resolveRuntimeDatabaseUrl();
  if (!raw) return null;

  const connectionString = prepareConnectionString(raw);
  const pool = new Pool({
    connectionString,
    ssl: isSupabaseConnection(raw) ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();
if (prisma) globalForPrisma.prisma = prisma;

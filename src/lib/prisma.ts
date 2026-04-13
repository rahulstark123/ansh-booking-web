import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

/**
 * Supabase transaction pooler (6543) + `pgbouncer=true` is tuned for Prisma’s classic query engine.
 * `@prisma/adapter-pg` talks to `node-pg` directly and often fails against transaction mode;
 * use session mode on the **same pooler host** (5432, no `pgbouncer=true`).
 *
 * `db.<ref>.supabase.co` (many “direct” strings) is often unreachable from Vercel (IPv4 vs IPv6);
 * prefer pooler session URLs from the dashboard or derive them from the6543 string.
 */
function deriveSupabasePoolerSessionUrl(transactionUrl: string): string | null {
  if (!/pooler\.supabase\.(com|io)/i.test(transactionUrl)) return null;
  if (!/:(6543)(\/|\?|$)/.test(transactionUrl)) return null;
  let s = transactionUrl.replace(/:6543(\/|\?|$)/, ":5432$1");
  s = s.replace(/([?&])pgbouncer=true&?/gi, "$1");
  s = s.replace(/\?&/g, "?").replace(/[?&]$/, "").replace(/\?$/, "");
  return s;
}

/** Hostnames that commonly produce P1001 from IPv4-only serverless (e.g. Vercel). */
function isSupabaseIpv6StyleDirectUrl(url: string): boolean {
  return /@db\.[^/?]+\.supabase\.co/i.test(url);
}

function resolveRuntimeDatabaseUrl(): string | undefined {
  const override = process.env.PRISMA_RUNTIME_DATABASE_URL?.trim();
  if (override) return override;

  const pooled = process.env.DATABASE_URL?.trim();
  const direct = process.env.DIRECT_URL?.trim();
  const derivedSession = pooled ? deriveSupabasePoolerSessionUrl(pooled) : null;

  const pooledPort = pooled?.match(/:(\d+)(?:\/|\?|$)/)?.[1];

  if (pooled && pooledPort === "6543") {
    if (direct) {
      if (isSupabaseIpv6StyleDirectUrl(direct)) {
        return derivedSession ?? direct;
      }
      return direct;
    }
    return derivedSession ?? pooled;
  }

  if (pooled && isSupabaseIpv6StyleDirectUrl(pooled) && derivedSession) {
    return derivedSession;
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
    connectionTimeoutMillis: 15_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();
if (prisma) globalForPrisma.prisma = prisma;

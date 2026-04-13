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
 * `db.<ref>.supabase.co` is often unreachable from Vercel (IPv4 vs IPv6). Use `*.pooler.supabase.com`
 * from Supabase → Connect, or set `DATABASE_POOLER_URL`.
 */
function deriveSupabasePoolerSessionUrl(transactionUrl: string): string | null {
  if (!/pooler\.supabase\.(com|io)/i.test(transactionUrl)) return null;
  if (!/:(6543)(\/|\?|$)/.test(transactionUrl)) return null;
  let s = transactionUrl.replace(/:6543(\/|\?|$)/, ":5432$1");
  s = s.replace(/([?&])pgbouncer=true&?/gi, "$1");
  s = s.replace(/\?&/g, "?").replace(/[?&]$/, "").replace(/\?$/, "");
  return s;
}

/** Direct DB hostname — commonly P1001 from IPv4-only serverless (e.g. Vercel). */
function isSupabaseDbCoDirectHost(url: string): boolean {
  return /@db\.[^/?]+\.supabase\.co/i.test(url);
}

function isProductionLikeServer(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

/** Allow db.* host locally or when explicitly opted in. */
function allowSupabaseDbCoHost(): boolean {
  return process.env.PRISMA_ALLOW_DB_HOST === "1" || !isProductionLikeServer();
}

function resolveRuntimeDatabaseUrl(): string | undefined {
  const override =
    process.env.PRISMA_RUNTIME_DATABASE_URL?.trim() ||
    process.env.DATABASE_POOLER_URL?.trim();
  if (override) return override;

  const pooled = process.env.DATABASE_URL?.trim();
  const direct = process.env.DIRECT_URL?.trim();
  const derivedSession = pooled ? deriveSupabasePoolerSessionUrl(pooled) : null;

  const pooledPort = pooled?.match(/:(\d+)(?:\/|\?|$)/)?.[1];

  if (pooled && pooledPort === "6543") {
    if (direct) {
      if (isSupabaseDbCoDirectHost(direct)) {
        return derivedSession ?? direct;
      }
      return direct;
    }
    return derivedSession ?? pooled;
  }

  if (pooled && isSupabaseDbCoDirectHost(pooled) && derivedSession) {
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

  if (isSupabaseDbCoDirectHost(raw) && !allowSupabaseDbCoHost()) {
    console.error(
      "[prisma] Refusing db.*.supabase.co for Prisma in production (unreachable from Vercel → P1001). " +
        "Set DATABASE_URL to *.pooler.supabase.com (6543 transaction or 5432 session from Supabase Connect), " +
        "or set DATABASE_POOLER_URL to the Session pooler string. " +
        "Local override: PRISMA_ALLOW_DB_HOST=1.",
    );
    return null;
  }

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

const ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "DATABASE_POOLER_URL",
  "PRISMA_RUNTIME_DATABASE_URL",
] as const;

/** When `prisma` is null, explain misconfiguration for API503 responses. */
export function getPrismaConfigurationError():
  | { code: string; message: string }
  | null {
  if (prisma) return null;

  const hasAnyEnv = ENV_KEYS.some((k) => Boolean(process.env[k]?.trim()));
  const candidate = resolveRuntimeDatabaseUrl();

  if (!candidate && !hasAnyEnv) {
    return {
      code: "missing_database_url",
      message: "No database URL is configured. Set DATABASE_URL (Supabase pooler) on the server.",
    };
  }

  if (candidate && isSupabaseDbCoDirectHost(candidate) && !allowSupabaseDbCoHost()) {
    return {
      code: "use_pooler_not_db_host",
      message:
        "DATABASE_URL or DIRECT_URL uses db.*.supabase.co, which Vercel often cannot reach. " +
        "In Supabase → Connect, copy the pooler URI (*.pooler.supabase.com, port 6543 or 5432) into DATABASE_URL, " +
        "or set DATABASE_POOLER_URL to the Session pooler (5432) string.",
    };
  }

  if (!candidate && hasAnyEnv) {
    return {
      code: "invalid_database_url",
      message: "Database environment variables are set but no usable connection string was resolved.",
    };
  }

  return null;
}

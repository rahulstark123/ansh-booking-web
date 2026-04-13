import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

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
  const raw = process.env.DATABASE_URL;
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

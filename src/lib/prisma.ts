import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function buildPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  const pool = new Pool({
    connectionString,
    // Supabase Postgres requires TLS outside local dev
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) globalForPrisma.prisma = prisma;

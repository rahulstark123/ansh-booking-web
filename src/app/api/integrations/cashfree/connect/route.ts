import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function supabaseUrlAndAnonKey(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!url?.trim() || !anonKey?.trim()) return null;
  return { url: url.trim(), anonKey: anonKey.trim() };
}

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

function cashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_APP_ID?.trim() && process.env.CASHFREE_SECRET_KEY?.trim());
}

async function resolveWid(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  userId: string,
): Promise<number> {
  const wid = (await prisma.userProfile.findUnique({ where: { id: userId }, select: { wid: true } }))?.wid;
  if (wid) return wid;
  const agg = await prisma.userProfile.aggregate({ _max: { wid: true } });
  return (agg._max.wid ?? 0) + 1;
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!cashfreeConfigured()) {
    return NextResponse.json({ error: "Cashfree credentials are not configured on server." }, { status: 503 });
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const wid = await resolveWid(prisma, user.id);
  const envName = (process.env.CASHFREE_ENV?.trim() || "TEST").toUpperCase();

  await prisma.integrationConnection.upsert({
    where: { hostId_provider: { hostId: user.id, provider: "CASHFREE" } },
    update: {
      accessToken: `cashfree_${envName.toLowerCase()}_connected`,
      refreshToken: null,
      scope: envName,
      expiresAt: null,
    },
    create: {
      hostId: user.id,
      wid,
      provider: "CASHFREE",
      accessToken: `cashfree_${envName.toLowerCase()}_connected`,
      refreshToken: null,
      scope: envName,
      expiresAt: null,
    },
  });

  return NextResponse.json({ ok: true as const });
}

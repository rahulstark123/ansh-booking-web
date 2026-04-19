import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

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

type Body = {
  keyId?: string;
  keySecret?: string;
  /** Razorpay Dashboard → Webhooks → signing secret (verifies `order.paid` callbacks). */
  webhookSecret?: string;
};

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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const keyId = body.keyId?.trim() ?? "";
  const keySecret = body.keySecret?.trim() ?? "";
  const webhookSecret = body.webhookSecret?.trim() || null;

  if (!keyId.startsWith("rzp_") || keyId.length < 14) {
    return NextResponse.json({ error: "Key ID should look like rzp_test_… or rzp_live_…" }, { status: 400 });
  }
  if (keySecret.length < 10) {
    return NextResponse.json({ error: "Key Secret looks too short." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const wid = await resolveWid(prisma, user.id);

  await prisma.integrationConnection.upsert({
    where: { hostId_provider: { hostId: user.id, provider: "RAZORPAY" } },
    update: {
      accessToken: keyId,
      refreshToken: keySecret,
      scope: webhookSecret,
      expiresAt: null,
    },
    create: {
      hostId: user.id,
      wid,
      provider: "RAZORPAY",
      accessToken: keyId,
      refreshToken: keySecret,
      scope: webhookSecret,
      expiresAt: null,
    },
  });

  return NextResponse.json({ ok: true as const });
}

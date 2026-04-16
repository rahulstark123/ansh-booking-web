import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
  const t = h.slice(7).trim();
  return t || null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
  }

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
  }

  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !authUser?.id) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: authUser.id },
      select: { plan: true },
    });

    const activeSubscription = await prisma.subscription.findFirst({
      where: { hostId: authUser.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        plan: true,
        status: true,
        provider: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        startedAt: true,
        createdAt: true,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: { hostId: authUser.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        description: true,
        providerPaymentId: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      plan: profile?.plan ?? "FREE",
      activeSubscription,
      transactions,
    });
  } catch (e) {
    console.error("[api/billing/summary]", e);
    return NextResponse.json({ error: "Failed to load billing summary." }, { status: 500 });
  }
}

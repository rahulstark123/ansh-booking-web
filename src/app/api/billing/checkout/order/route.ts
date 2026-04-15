import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getRazorpayConfig, getRazorpayInstance } from "@/lib/billing/razorpay";
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

function workspaceIdFromMeta(meta: unknown): number | null {
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>;
    const parse = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isInteger(v) && v > 0) return v;
      if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
      return null;
    };
    const direct = parse(m.workspace_id);
    if (direct) return direct;
    const alt = parse(m.wid);
    if (alt) return alt;
  }
  return null;
}

async function nextWorkspaceId(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
): Promise<number> {
  const agg = await prisma.userProfile.aggregate({ _max: { wid: true } });
  return (agg._max.wid ?? 0) + 1;
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
  }

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
  }

  const billingCfg = getRazorpayConfig();
  if (!billingCfg) {
    return NextResponse.json({ error: "Razorpay is not configured on the server." }, { status: 503 });
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
    const requestedWid = workspaceIdFromMeta(authUser.user_metadata);
    const existing = await prisma.userProfile.findUnique({
      where: { id: authUser.id },
      select: { wid: true, email: true, fullName: true, plan: true },
    });
    const nextEmail = authUser.email ?? "";
    const nextName =
      (authUser.user_metadata?.full_name as string | undefined)?.trim() ||
      authUser.email?.split("@")[0] ||
      "User";

    let wid = existing?.wid ?? null;
    if (existing) {
      if (existing.email !== nextEmail || existing.fullName !== nextName) {
        await prisma.userProfile.update({
          where: { id: authUser.id },
          data: { email: nextEmail, fullName: nextName },
        });
      }
      if (existing.plan === "PRO") {
        return NextResponse.json({ error: "You already have an active Pro plan." }, { status: 409 });
      }
    } else {
      wid = requestedWid ?? (await nextWorkspaceId(prisma));
      if (requestedWid) {
        const used = await prisma.userProfile.findFirst({ where: { wid: requestedWid } });
        if (used) wid = await nextWorkspaceId(prisma);
      }
      await prisma.userProfile.create({
        data: {
          id: authUser.id,
          email: nextEmail,
          wid,
          fullName: nextName,
        },
      });
    }
    if (wid == null) wid = await nextWorkspaceId(prisma);

    const razorpay = getRazorpayInstance(billingCfg);
    const receipt = `sub_${Date.now()}_${wid}`;
    const order = await razorpay.orders.create({
      amount: billingCfg.proPlanAmountPaisa,
      currency: "INR",
      receipt,
      notes: {
        hostId: authUser.id,
        plan: "PRO",
      },
    });

    const created = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          hostId: authUser.id,
          wid,
          plan: "PRO",
          provider: "RAZORPAY",
          status: "PENDING",
          providerOrderId: order.id,
        },
        select: { id: true },
      });
      const transaction = await tx.transaction.create({
        data: {
          hostId: authUser.id,
          wid,
          subscriptionId: subscription.id,
          status: "CREATED",
          provider: "RAZORPAY",
          amount: billingCfg.proPlanAmountPaisa,
          currency: "INR",
          providerOrderId: order.id,
          description: "ANSH Bookings Pro Monthly",
          metadata: { receipt },
        },
        select: { id: true },
      });
      return { subscriptionId: subscription.id, transactionId: transaction.id };
    });

    return NextResponse.json({
      keyId: billingCfg.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: "PRO",
      subscriptionId: created.subscriptionId,
      transactionId: created.transactionId,
      prefill: {
        name: nextName,
        email: nextEmail,
      },
      companyName: "ANSH Bookings",
      description: "Pro Plan (Monthly)",
    });
  } catch (e) {
    console.error("[api/billing/checkout/order]", e);
    return NextResponse.json({ error: "Failed to create checkout order." }, { status: 500 });
  }
}

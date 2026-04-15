import crypto from "crypto";

import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getRazorpayConfig } from "@/lib/billing/razorpay";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type VerifyBody = {
  subscriptionId?: string;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

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

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const subscriptionId = body.subscriptionId?.trim() ?? "";
  const transactionId = body.transactionId?.trim() ?? "";
  const orderId = body.razorpayOrderId?.trim() ?? "";
  const paymentId = body.razorpayPaymentId?.trim() ?? "";
  const signature = body.razorpaySignature?.trim() ?? "";
  if (!subscriptionId || !transactionId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, hostId: authUser.id },
      select: { id: true, status: true, providerOrderId: true, subscriptionId: true },
    });
    if (!transaction || transaction.subscriptionId !== subscriptionId) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
    if (transaction.providerOrderId !== orderId) {
      return NextResponse.json({ error: "Order mismatch." }, { status: 400 });
    }
    if (transaction.status === "SUCCESS") {
      return NextResponse.json({ ok: true as const });
    }

    const expected = crypto
      .createHmac("sha256", billingCfg.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (expected !== signature) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "FAILED",
          providerPaymentId: paymentId,
          providerSignature: signature,
          failedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const now = new Date();
    const monthEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "SUCCESS",
          providerPaymentId: paymentId,
          providerSignature: signature,
          paidAt: now,
        },
      }),
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          providerPaymentId: paymentId,
          currentPeriodStart: now,
          currentPeriodEnd: monthEnd,
          startedAt: now,
        },
      }),
      prisma.userProfile.update({
        where: { id: authUser.id },
        data: { plan: "PRO" },
      }),
    ]);

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[api/billing/checkout/verify]", e);
    return NextResponse.json({ error: "Failed to verify payment." }, { status: 500 });
  }
}

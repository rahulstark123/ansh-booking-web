import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getHostRazorpayCredentials, maskRazorpayKeyId } from "@/lib/host-razorpay";
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

/**
 * Razorpay “Connect” status for meeting payments (host-owned keys).
 */
export async function GET(req: NextRequest) {
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

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  try {
    const creds = await getHostRazorpayCredentials(prisma, user.id);
    const originHint =
      req.nextUrl.searchParams.get("origin")?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : "");

    const webhookUrl = originHint
      ? `${originHint}/api/webhooks/razorpay?hostId=${encodeURIComponent(user.id)}`
      : null;

    return NextResponse.json({
      razorpayConnected: Boolean(creds),
      keyIdPreview: creds ? maskRazorpayKeyId(creds.keyId) : null,
      webhookUrl,
      hasWebhookSecret: Boolean(creds?.webhookSecret),
      hostId: user.id,
    });
  } catch (e) {
    console.error("[api/integrations/razorpay/status]", e);
    return NextResponse.json({ error: "Failed to load status." }, { status: 500 });
  }
}

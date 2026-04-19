import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getHostRazorpayCredentials } from "@/lib/host-razorpay";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

/**
 * Per-host Razorpay webhooks. Add URL in Razorpay Dashboard with query `?hostId=<your user id>`.
 * Subscribe to **order.paid** (and optionally payment.captured). Signing secret is stored when you save the integration.
 */
export async function POST(req: NextRequest) {
  const hostId = req.nextUrl.searchParams.get("hostId")?.trim() ?? "";
  if (!hostId) {
    return NextResponse.json({ error: "Missing hostId query parameter." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const creds = await getHostRazorpayCredentials(prisma, hostId);
  if (!creds?.webhookSecret) {
    return NextResponse.json(
      { error: "Webhook signing secret not configured. Paste it when saving Razorpay in Integrations." },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature")?.trim() ?? "";
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expected = crypto.createHmac("sha256", creds.webhookSecret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { order?: { entity?: { id?: string } }; payment?: { entity?: { id?: string } } } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = event.event ?? "";
  if (eventName === "order.paid" || eventName === "payment.captured") {
    // Booking is confirmed client-side after checkout; webhook is for reconciliation / future automation.
    console.info("[webhooks/razorpay]", { hostId, event: eventName, orderId: event.payload?.order?.entity?.id });
  }

  return NextResponse.json({ ok: true as const });
}

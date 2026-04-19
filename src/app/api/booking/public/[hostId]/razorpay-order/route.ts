import { NextResponse, type NextRequest } from "next/server";

import { getHostRazorpayCredentials, getRazorpayFromHostCredentials } from "@/lib/host-razorpay";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type Body = {
  eventId?: string;
  startsAt?: string;
  guestEmail?: string;
  guestName?: string;
};

/**
 * Creates a Razorpay order for a paid public booking. Amount and notes come from the DB only.
 * Guest must complete checkout, then POST the booking with payment ids + signature.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ hostId: string }> }) {
  const { hostId } = await ctx.params;
  if (!hostId?.trim()) {
    return NextResponse.json({ error: "hostId is required." }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventId = body.eventId?.trim() ?? "";
  const startsAtRaw = body.startsAt?.trim() ?? "";
  if (!eventId || !startsAtRaw) {
    return NextResponse.json({ error: "eventId and startsAt are required." }, { status: 400 });
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt must be a valid ISO date-time." }, { status: 400 });
  }
  const startsAtIso = startsAt.toISOString();

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const host = await prisma.userProfile.findUnique({
      where: { id: hostId },
      select: { id: true, wid: true, fullName: true },
    });
    if (!host) {
      return NextResponse.json({ error: "Host not found." }, { status: 404 });
    }

    const eventType = await prisma.bookingEventType.findFirst({
      where: { id: eventId, hostId: host.id, wid: host.wid, isActive: true },
      select: {
        id: true,
        eventName: true,
        paymentEnabled: true,
        paymentProvider: true,
        paymentAmountPaisa: true,
        paymentLabel: true,
      },
    });
    if (!eventType) {
      return NextResponse.json({ error: "Event type not found." }, { status: 404 });
    }

    if (
      !eventType.paymentEnabled ||
      eventType.paymentProvider !== "razorpay" ||
      eventType.paymentAmountPaisa == null ||
      eventType.paymentAmountPaisa < 100
    ) {
      return NextResponse.json({ error: "This event does not require Razorpay payment." }, { status: 400 });
    }

    const hostCreds = await getHostRazorpayCredentials(prisma, host.id);
    if (!hostCreds) {
      return NextResponse.json(
        {
          error:
            "This host has not connected Razorpay. Ask them to open Integrations → Razorpay and save their API keys.",
        },
        { status: 503 },
      );
    }

    const razorpay = getRazorpayFromHostCredentials(hostCreds);
    const receipt = `bk_${eventType.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: eventType.paymentAmountPaisa,
      currency: "INR",
      receipt,
      notes: {
        purpose: "booking",
        hostId: host.id,
        eventId: eventType.id,
        startsAt: startsAtIso,
      },
    });

    const description =
      (eventType.paymentLabel?.trim() || `Booking: ${eventType.eventName}`).slice(0, 200);

    return NextResponse.json({
      keyId: hostCreds.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency ?? "INR",
      description,
      companyName: host.fullName || "Host",
      prefill: {
        email: body.guestEmail?.trim() || undefined,
        name: body.guestName?.trim() || undefined,
      },
    });
  } catch (e) {
    console.error("[api/booking/public/[hostId]/razorpay-order]", e);
    return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  }
}

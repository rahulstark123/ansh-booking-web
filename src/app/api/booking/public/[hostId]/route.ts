import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";
import { normalizeBookingPageTheme } from "@/lib/booking-page-templates";
import { verifyRazorpayPaymentSignature } from "@/lib/billing/razorpay-signature";
import { assertBookingRazorpayOrderValid } from "@/lib/billing/verify-booking-razorpay-order";
import { getHostRazorpayCredentials, getRazorpayFromHostCredentials } from "@/lib/host-razorpay";
import { generateMeetingLinkForHost } from "@/lib/google-meet";
import { getPrisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function addMinutes(d: Date, minutes: number): Date {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + minutes);
  return x;
}

function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function scheduledBlockEnd(startsAt: Date, endsAt: Date | null): Date {
  return endsAt ?? addMinutes(startsAt, 60);
}

function overrideToInterval(date: Date, startTime: string, endTime: string): { startsAt: Date; endsAt: Date } {
  const day = date.toISOString().slice(0, 10);
  return {
    startsAt: new Date(`${day}T${startTime}:00+05:30`),
    endsAt: new Date(`${day}T${endTime}:00+05:30`),
  };
}

type PublicAvailabilityRow = {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const DAY_KEY_TO_NUMBER: Record<string, number> = {
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
  sun: 7,
  sunday: 7,
};

const DEFAULT_WEEK: PublicAvailabilityRow[] = [
  { dayOfWeek: 1, enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, enabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 6, enabled: false, startTime: "09:00", endTime: "13:00" },
  { dayOfWeek: 7, enabled: false, startTime: "09:00", endTime: "13:00" },
];

function toDayOfWeek(dayKey: string): number | null {
  const key = dayKey.trim().toLowerCase();
  return DAY_KEY_TO_NUMBER[key] ?? null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ hostId: string }> },
) {
  const { hostId } = await ctx.params;
  if (!hostId?.trim()) {
    return NextResponse.json({ error: "hostId is required." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const eventQuery = req.nextUrl.searchParams.get("event")?.trim() || null;

  try {
    const host = await prisma.userProfile.findUnique({
      where: { id: hostId },
      select: { 
        id: true, 
        wid: true, 
        fullName: true, 
        plan: true, 
        platformBranding: true, 
        workspaceLogo: true 
      },
    });
    if (!host) {
      return NextResponse.json({ error: "Host not found." }, { status: 404 });
    }

    const eventTypes = await prisma.bookingEventType.findMany({
      where: { hostId: host.id, wid: host.wid, isActive: true },
      include: { weekSlots: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    if (eventTypes.length === 0) {
      return NextResponse.json({ error: "No active event type found for this host." }, { status: 404 });
    }

    let selected = eventTypes.find((e) => e.id === eventQuery) ?? null;

    if (!selected && eventQuery) {
      const maybeMeeting = await prisma.scheduledMeeting.findFirst({
        where: { hostId: host.id, wid: host.wid, id: eventQuery },
        select: { eventTypeId: true },
      });
      if (maybeMeeting?.eventTypeId) {
        selected = eventTypes.find((e) => e.id === maybeMeeting.eventTypeId) ?? null;
      }
    }

    selected ??= eventTypes[0];

    const fromWeekSlots: PublicAvailabilityRow[] = selected.weekSlots
      .map((slot) => {
        const dayOfWeek = toDayOfWeek(slot.dayKey);
        if (!dayOfWeek) return null;
        return {
          dayOfWeek,
          enabled: slot.enabled,
          startTime: slot.startTime,
          endTime: slot.endTime,
        } satisfies PublicAvailabilityRow;
      })
      .filter((slot): slot is PublicAvailabilityRow => Boolean(slot))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    const availability =
      fromWeekSlots.length > 0
        ? fromWeekSlots
        : await prisma.availabilityWeeklyHour
            .findMany({
              where: { hostId: host.id, wid: host.wid },
              orderBy: { dayOfWeek: "asc" },
            })
            .then((rows) =>
              rows.length > 0
                ? rows.map((r) => ({
                    dayOfWeek: r.dayOfWeek,
                    enabled: r.enabled,
                    startTime: r.startTime,
                    endTime: r.endTime,
                  }))
                : DEFAULT_WEEK,
            );

    const [scheduledBlocks, guestBookedBlocks, overrides] = await Promise.all([
      prisma.scheduledMeeting.findMany({
        where: { hostId: host.id, wid: host.wid, status: "UPCOMING" },
        select: { startsAt: true, endsAt: true },
      }),
      selected.kind === "ONE_ON_ONE"
        ? prisma.bookedMeeting.findMany({
            where: { hostId: host.id, wid: host.wid, status: "UPCOMING" },
            select: { startsAt: true, endsAt: true },
          })
        : Promise.resolve([]),
      prisma.availabilityOverride.findMany({
        where: { hostId: host.id, wid: host.wid },
        select: { date: true, startTime: true, endTime: true, isAllDay: true },
      }),
    ]);

    const overrideIntervals = overrides.flatMap((o) => {
      const day = o.date.toISOString().slice(0, 10);
      if (o.isAllDay) {
        const startsAt = new Date(`${day}T00:00:00+05:30`);
        const endsAt = new Date(`${day}T23:59:59+05:30`);
        return [{ startsAt, endsAt }];
      }
      if (!o.startTime || !o.endTime) return [];
      return [overrideToInterval(o.date, o.startTime, o.endTime)];
    });

    const bookedIntervals = [
      ...scheduledBlocks.map((s) => ({
        startsAt: s.startsAt.toISOString(),
        endsAt: scheduledBlockEnd(s.startsAt, s.endsAt).toISOString(),
      })),
      ...guestBookedBlocks.map((b) => ({
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
      })),
      ...overrideIntervals.map((o) => ({
        startsAt: o.startsAt.toISOString(),
        endsAt: o.endsAt.toISOString(),
      })),
    ];

    const hostRazorpay = await prisma.integrationConnection.findUnique({
      where: { hostId_provider: { hostId: host.id, provider: "RAZORPAY" } },
      select: { accessToken: true, refreshToken: true },
    });
    const hostRazorpayReady = Boolean(
      hostRazorpay?.accessToken?.trim() && hostRazorpay?.refreshToken?.trim(),
    );

    return NextResponse.json({
      host: {
        id: host.id,
        name: host.fullName,
        plan: host.plan,
        platformBranding: host.platformBranding,
        workspaceLogo: host.workspaceLogo,
      },
      event: {
        id: selected.id,
        title: selected.eventName,
        durationMinutes: selected.durationMinutes,
        kind: selected.kind,
        bookingPageTheme: normalizeBookingPageTheme(selected.bookingPageTheme),
        payment:
          selected.paymentEnabled &&
          selected.paymentProvider === "razorpay" &&
          selected.paymentAmountPaisa != null &&
          selected.paymentAmountPaisa >= 100
            ? {
                enabled: true,
                provider: "razorpay" as const,
                amountPaisa: selected.paymentAmountPaisa,
                amountLabel: new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: selected.paymentAmountPaisa % 100 === 0 ? 0 : 2,
                }).format(selected.paymentAmountPaisa / 100),
                label: (selected.paymentLabel?.trim() || "Meeting fee").slice(0, 160),
                hostRazorpayReady,
              }
            : { enabled: false as const },
      },
      availability,
      bookedIntervals,
      timezone: "Asia/Kolkata",
    });
  } catch (error) {
    console.error("[api/booking/public/[hostId]]", error);
    return NextResponse.json({ error: "Failed to load booking page details." }, { status: 500 });
  }
}

type CreatePublicBookingBody = {
  eventId?: string;
  startsAt?: string;
  guestName?: string;
  guestEmail?: string;
  guestCountryCode?: string;
  guestPhone?: string;
  notes?: string;
  guests?: string[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ hostId: string }> },
) {
  const { hostId } = await ctx.params;
  if (!hostId?.trim()) {
    return NextResponse.json({ error: "hostId is required." }, { status: 400 });
  }

  let body: CreatePublicBookingBody;
  try {
    body = (await req.json()) as CreatePublicBookingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const guestNameNorm = body.guestName?.trim() ?? "";
  const guestEmailNorm = body.guestEmail?.trim() ?? "";
  const guestCountryCodeNorm = body.guestCountryCode?.trim() ?? "";
  const guestPhoneNorm = body.guestPhone?.trim() ?? "";
  if (!body.eventId || !body.startsAt || !guestNameNorm || !guestEmailNorm || !guestPhoneNorm || !guestCountryCodeNorm) {
    return NextResponse.json(
      { error: "eventId, startsAt, guestName, guestEmail, guestCountryCode and guestPhone are required." },
      { status: 400 },
    );
  }
  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt must be a valid ISO date-time." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmailNorm)) {
    return NextResponse.json({ error: "guestEmail must be a valid email." }, { status: 400 });
  }
  if (!/^\+\d{1,4}$/.test(guestCountryCodeNorm)) {
    return NextResponse.json({ error: "guestCountryCode format is invalid." }, { status: 400 });
  }
  if (!/^[\d\s()-]{6,20}$/.test(guestPhoneNorm)) {
    return NextResponse.json({ error: "guestPhone format is invalid." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const host = await prisma.userProfile.findUnique({
      where: { id: hostId },
      select: { id: true, wid: true, fullName: true, email: true },
    });
    if (!host) {
      return NextResponse.json({ error: "Host not found." }, { status: 404 });
    }

    const eventType = await prisma.bookingEventType.findFirst({
      where: { id: body.eventId, hostId: host.id, wid: host.wid, isActive: true },
      select: {
        id: true,
        eventName: true,
        kind: true,
        durationMinutes: true,
        location: true,
        paymentEnabled: true,
        paymentProvider: true,
        paymentAmountPaisa: true,
        paymentLabel: true,
      },
    });
    if (!eventType) {
      return NextResponse.json({ error: "Event type not found." }, { status: 404 });
    }

    const requiresRazorpay =
      Boolean(eventType.paymentEnabled) &&
      eventType.paymentProvider === "razorpay" &&
      typeof eventType.paymentAmountPaisa === "number" &&
      eventType.paymentAmountPaisa >= 100;

    const startsAtIso = startsAt.toISOString();
    let verifiedRazorpay: { orderId: string; paymentId: string } | null = null;

    if (requiresRazorpay) {
      const orderId = body.razorpayOrderId?.trim() ?? "";
      const paymentId = body.razorpayPaymentId?.trim() ?? "";
      const signature = body.razorpaySignature?.trim() ?? "";
      if (!orderId || !paymentId || !signature) {
        return NextResponse.json(
          {
            error: "Payment is required for this event. Complete checkout, then try again.",
            code: "PAYMENT_REQUIRED",
          },
          { status: 402 },
        );
      }

      const hostCreds = await getHostRazorpayCredentials(prisma, host.id);
      if (!hostCreds) {
        return NextResponse.json(
          { error: "This host has not connected Razorpay. Meeting payments are unavailable." },
          { status: 503 },
        );
      }

      if (!verifyRazorpayPaymentSignature(orderId, paymentId, signature, hostCreds.keySecret)) {
        return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
      }

      const razorpay = getRazorpayFromHostCredentials(hostCreds);
      const orderOk = await assertBookingRazorpayOrderValid({
        razorpay,
        orderId,
        expectedAmountPaisa: eventType.paymentAmountPaisa!,
        hostId: host.id,
        eventId: eventType.id,
        startsAtIso,
      });
      if (!orderOk.ok) {
        return NextResponse.json({ error: orderOk.message }, { status: 400 });
      }

      const existingPayment = await prisma.bookedMeeting.findFirst({
        where: { razorpayPaymentId: paymentId },
        select: { id: true },
      });
      if (existingPayment) {
        return NextResponse.json({ error: "This payment was already used for a booking." }, { status: 409 });
      }

      verifiedRazorpay = { orderId, paymentId };
    }

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + Math.max(15, eventType.durationMinutes));
    
    // Combine primary guest email with additional guests for the meeting invitation
    const allAttendees = Array.from(new Set([guestEmailNorm, ...(body.guests ?? [])]));

    const meetingLink = await generateMeetingLinkForHost(host.id, host.wid, eventType.location, {
      summary: eventType.eventName,
      description: `Booked by ${guestNameNorm} (${guestEmailNorm})${body.guests?.length ? `\nGuests: ${body.guests.join(", ")}` : ""}${body.notes ? `\n\nNotes: ${body.notes}` : ""}`,
      startsAt,
      endsAt,
      attendees: allAttendees,
    });

    try {
      const booking = await prisma.$transaction(
        async (tx) => {
          const hostScheduled = await tx.scheduledMeeting.findMany({
            where: { hostId: host.id, wid: host.wid, status: "UPCOMING" },
            select: { startsAt: true, endsAt: true },
          });
          for (const s of hostScheduled) {
            const blockEnd = scheduledBlockEnd(s.startsAt, s.endsAt);
            if (intervalsOverlap(startsAt, endsAt, s.startsAt, blockEnd)) {
              const err = new Error("SLOT_TAKEN");
              throw err;
            }
          }

          if (eventType.kind === "ONE_ON_ONE") {
            const existingBookings = await tx.bookedMeeting.findMany({
              where: { hostId: host.id, wid: host.wid, status: "UPCOMING" },
              select: { startsAt: true, endsAt: true },
            });
            for (const b of existingBookings) {
              if (intervalsOverlap(startsAt, endsAt, b.startsAt, b.endsAt)) {
                const err = new Error("SLOT_TAKEN");
                throw err;
              }
            }
          }

          const dateStart = new Date(startsAt);
          dateStart.setUTCHours(0, 0, 0, 0);
          const dateEnd = new Date(startsAt);
          dateEnd.setUTCHours(23, 59, 59, 999);
          const overrides = await tx.availabilityOverride.findMany({
            where: {
              hostId: host.id,
              wid: host.wid,
              date: { gte: dateStart, lte: dateEnd },
            },
            select: { date: true, startTime: true, endTime: true, isAllDay: true },
          });
          for (const o of overrides) {
            if (o.isAllDay) {
              const err = new Error("SLOT_TAKEN");
              throw err;
            }
            if (!o.startTime || !o.endTime) continue;
            const interval = overrideToInterval(o.date, o.startTime, o.endTime);
            if (intervalsOverlap(startsAt, endsAt, interval.startsAt, interval.endsAt)) {
              const err = new Error("SLOT_TAKEN");
              throw err;
            }
          }

          return tx.bookedMeeting.create({
            data: {
              hostId: host.id,
              wid: host.wid,
              eventTypeId: eventType.id,
              guestName: guestNameNorm,
              guestEmail: guestEmailNorm,
              meetingLink,
              guestCountryCode: guestCountryCodeNorm,
              guestPhone: guestPhoneNorm,
              guestNotes: [
                body.guests?.length ? `Guests: ${body.guests.join(", ")}` : "",
                body.notes?.trim() || ""
              ].filter(Boolean).join("\n\n") || null,
              startsAt,
              endsAt,
              status: "UPCOMING",
              razorpayPaymentId: verifiedRazorpay?.paymentId ?? null,
              razorpayOrderId: verifiedRazorpay?.orderId ?? null,
            },
            select: { id: true, meetingLink: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await prisma.contact.upsert({
        where: {
          hostId_email: {
            hostId: host.id,
            email: guestEmailNorm,
          },
        },
        update: {
          fullName: guestNameNorm,
          countryCode: guestCountryCodeNorm,
          phone: guestPhoneNorm,
          lastBookedAt: startsAt,
        },
        create: {
          hostId: host.id,
          wid: host.wid,
          fullName: guestNameNorm,
          email: guestEmailNorm,
          countryCode: guestCountryCodeNorm,
          phone: guestPhoneNorm,
          lastBookedAt: startsAt,
          notes: body.notes?.trim() || null,
        },
      });

      try {
        await sendBookingConfirmationEmail({
          bookingId: booking.id,
          guestName: guestNameNorm,
          guestEmail: guestEmailNorm,
          hostName: host.fullName,
          hostEmail: host.email,
          eventName: eventType.eventName,
          startsAt,
          endsAt,
          meetingLink: booking.meetingLink,
          timezone: "Asia/Kolkata",
          notes: body.notes?.trim() || null,
        });
      } catch (mailError) {
        // Booking remains successful even if email delivery temporarily fails.
        console.error("[booking-confirmation-email]", mailError);
      }

      await createNotification({
        userId: host.id,
        title: "New Booking Received",
        message: `${guestNameNorm} booked ${eventType.eventName} for ${startsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        type: "booking",
        link: `/dashboard/meetings?id=${booking.id}`,
      });

      return NextResponse.json(
        {
          ok: true as const,
          bookingId: booking.id,
          meetingLink: booking.meetingLink,
          note: body.notes?.trim() || null,
        },
        { status: 201 },
      );
    } catch (e) {
      if (e instanceof Error && e.message === "SLOT_TAKEN") {
        return NextResponse.json(
          { error: "This time slot is no longer available. Please choose another." },
          { status: 409 },
        );
      }
      throw e;
    }
  } catch (error) {
    console.error("[api/booking/public/[hostId]][POST]", error);
    return NextResponse.json({ error: "Failed to schedule meeting." }, { status: 500 });
  }
}

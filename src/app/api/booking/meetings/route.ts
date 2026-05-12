import type { ScheduledMeetingStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { bookingLocationLabel } from "@/lib/booking-location-label";
import { formatMeetingListTime } from "@/lib/format-meeting-list-time";
import { generateMeetingLinkForHost } from "@/lib/google-meet";
import type { MeetingStatus, ScheduledMeeting } from "@/lib/meetings-data";
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

function statusToUi(s: ScheduledMeetingStatus): MeetingStatus {
  if (s === "UPCOMING") return "Upcoming";
  return "Completed";
}

function isScheduledStatus(value: string): value is ScheduledMeetingStatus {
  return value === "UPCOMING" || value === "COMPLETED" || value === "CANCELLED";
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

/**
 * GET — list host-created schedules (event types) for Scheduling table.
 * Consumer bookings are shown from `GET /api/booking/booked-meetings`.
 * Auth: `Authorization: Bearer <supabase access_token>`.
 */
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
    const rawPage = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const rawPageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "10");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(50, Math.max(1, Math.floor(rawPageSize))) : 10;

    const wid =
      (await prisma.userProfile.findUnique({ where: { id: authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));
    const eventTypeTotal = await prisma.bookingEventType.count({
      where: { hostId: authUser.id, wid, isActive: true },
    });
    const eventTypes = await prisma.bookingEventType.findMany({
      where: { hostId: authUser.id, wid, isActive: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const items: ScheduledMeeting[] = eventTypes.map((e) => ({
      id: `evt-${e.id}`,
      title: e.eventName,
      eventType: e.kind === "ONE_ON_ONE" ? "One-on-one" : e.kind === "GROUP" ? "Group" : "Round robin",
      guest: "Schedule created",
      time: "Booking link ready",
      status: "Upcoming",
      location: e.location,
      platform: bookingLocationLabel(e.location),
    }));
    return NextResponse.json({
      items,
      page,
      pageSize,
      total: eventTypeTotal,
      totalPages: Math.max(1, Math.ceil(eventTypeTotal / pageSize)),
    });
  } catch (e) {
    console.error("[api/booking/meetings]", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "Failed to load meetings.",
        detail: process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}

type CreateScheduledMeetingBody = {
  title: string;
  eventTypeLabel: string;
  guestName: string;
  startsAt: string;
  endsAt?: string;
  status?: ScheduledMeetingStatus;
  eventTypeId?: string;
};

/**
 * POST — create a scheduled meeting for the authenticated host.
 * Auth: `Authorization: Bearer <supabase access_token>`.
 */
export async function POST(req: NextRequest) {
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

  let body: CreateScheduledMeetingBody;
  try {
    body = (await req.json()) as CreateScheduledMeetingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.title?.trim() || !body?.eventTypeLabel?.trim() || !body?.guestName?.trim() || !body?.startsAt) {
    return NextResponse.json(
      { error: "title, eventTypeLabel, guestName and startsAt are required." },
      { status: 400 },
    );
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "startsAt must be a valid ISO date string." }, { status: 400 });
  }
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (body.endsAt && (!endsAt || Number.isNaN(endsAt.getTime()))) {
    return NextResponse.json({ error: "endsAt must be a valid ISO date string." }, { status: 400 });
  }

  const status = body.status && isScheduledStatus(body.status) ? body.status : "UPCOMING";

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const requestedWid = workspaceIdFromMeta(authUser.user_metadata);
    const existing = await prisma.userProfile.findUnique({
      where: { id: authUser.id },
      select: { wid: true, email: true, fullName: true },
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

    const eventTypeLocation = body.eventTypeId
      ? (
          await prisma.bookingEventType.findUnique({
            where: { id: body.eventTypeId },
            select: { location: true },
          })
        )?.location ?? "google-meet"
      : "google-meet";
    const generatedMeetingLink = await generateMeetingLinkForHost(authUser.id, wid, eventTypeLocation, {
      summary: body.title.trim(),
      description: body.eventTypeLabel.trim(),
      startsAt,
      endsAt: endsAt ?? new Date(startsAt.getTime() + 60 * 60 * 1000),
    });

    const created = await prisma.scheduledMeeting.create({
      data: {
        hostId: authUser.id,
        wid,
        eventTypeId: body.eventTypeId ?? null,
        title: body.title.trim(),
        eventTypeLabel: body.eventTypeLabel.trim(),
        guestName: body.guestName.trim(),
        meetingLink: generatedMeetingLink,
        startsAt,
        endsAt,
        status,
      },
      select: { id: true, meetingLink: true },
    });

    await createNotification({
      userId: authUser.id,
      title: "Manual Meeting Scheduled",
      message: `A meeting "${body.title}" with ${body.guestName} has been scheduled.`,
      type: "booking",
      link: "/dashboard/calendar",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[api/booking/meetings][POST]", e);
    return NextResponse.json(
      { error: "Failed to create scheduled meeting.", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

type UpdateEventTypeBody = {
  id?: string;
  title?: string;
};

/**
 * PATCH — update host event type title (shown in Scheduling table).
 * Body: { id: string, title: string }
 */
export async function PATCH(req: NextRequest) {
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

  let body: UpdateEventTypeBody;
  try {
    body = (await req.json()) as UpdateEventTypeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const id = body.id?.trim() ?? "";
  const title = body.title?.trim() ?? "";
  if (!id || !title) {
    return NextResponse.json({ error: "id and title are required." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const wid =
      (await prisma.userProfile.findUnique({ where: { id: authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));

    const updated = await prisma.bookingEventType.updateMany({
      where: { id, hostId: authUser.id, wid, isActive: true },
      data: { eventName: title },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    await createNotification({
      userId: authUser.id,
      title: "Booking Slot Updated",
      message: `The booking slot title has been updated to: ${title}`,
      type: "slot",
      link: "/dashboard/scheduling",
    });

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[api/booking/meetings][PATCH]", e);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}

/**
 * DELETE — soft delete host event type from Scheduling table.
 * Query: ?id=<eventTypeId>
 */
export async function DELETE(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });
  }

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) {
    return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });
  }

  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
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
    const wid =
      (await prisma.userProfile.findUnique({ where: { id: authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));

    const deleted = await prisma.bookingEventType.updateMany({
      where: { id, hostId: authUser.id, wid, isActive: true },
      data: { isActive: false },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[api/booking/meetings][DELETE]", e);
    return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });
  }
}

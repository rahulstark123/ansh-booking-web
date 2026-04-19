import type { BookingEventKind, ScheduledMeetingStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { bookingLocationLabel } from "@/lib/booking-location-label";
import { formatMeetingListTime } from "@/lib/format-meeting-list-time";
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

function eventKindLabel(kind: BookingEventKind): string {
  if (kind === "ONE_ON_ONE") return "One-on-one";
  if (kind === "GROUP") return "Group";
  return "Round robin";
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
 * GET — guest bookings from public booking links (`BookedMeeting` rows).
 * Auth: `Authorization: Bearer <supabase access_token>`.
 */
export async function GET(request: NextRequest) {
  const token = bearerToken(request);
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
    const rawPage = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const rawPageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(50, Math.max(1, Math.floor(rawPageSize))) : 10;
    const filter = request.nextUrl.searchParams.get("filter")?.trim().toLowerCase() ?? "all";

    const wid =
      (await prisma.userProfile.findUnique({ where: { id: authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));

    const where = {
      hostId: authUser.id,
      wid,
      ...(filter === "upcoming"
        ? { status: "UPCOMING" as const }
        : filter === "completed"
          ? { status: "COMPLETED" as const }
          : {}),
    };

    const total = await prisma.bookedMeeting.count({ where });
    const rows = await prisma.bookedMeeting.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: { eventType: { select: { eventName: true, kind: true, location: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const now = new Date();
    const items: ScheduledMeeting[] = rows.map((b) => ({
      id: b.id,
      title: b.eventType.eventName,
      eventType: eventKindLabel(b.eventType.kind),
      guest: `${b.guestName} <${b.guestEmail}>`,
      time: formatMeetingListTime(b.startsAt, now),
      status: statusToUi(b.status),
      meetingLink: b.meetingLink,
      location: b.eventType.location,
      platform: bookingLocationLabel(b.eventType.location),
    }));

    return NextResponse.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (e) {
    console.error("[api/booking/booked-meetings]", e);
    return NextResponse.json({ error: "Failed to load booked meetings." }, { status: 500 });
  }
}

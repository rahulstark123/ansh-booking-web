import type { ScheduledMeetingStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { formatMeetingListTime } from "@/lib/format-meeting-list-time";
import type { MeetingStatus, ScheduledMeeting } from "@/lib/meetings-data";
import { getPrisma } from "@/lib/prisma";

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

/**
 * GET — list scheduled meetings for the authenticated host (scheduling page table).
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
    const rows = await prisma.scheduledMeeting.findMany({
      where: { hostId: authUser.id },
      orderBy: { startsAt: "asc" },
    });

    const now = new Date();
    const payload: ScheduledMeeting[] = rows.map((m) => ({
      id: m.id,
      title: m.title,
      eventType: m.eventTypeLabel,
      guest: m.guestName,
      time: formatMeetingListTime(m.startsAt, now),
      status: statusToUi(m.status),
    }));

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/booking/meetings]", e);
    return NextResponse.json({ error: "Failed to load meetings." }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import type { AgendaItem } from "@/lib/dashboard-api";

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

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
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
    const hostId = authUser.id;
    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fetch upcoming booked and scheduled meetings
    const [booked, scheduled] = await Promise.all([
      prisma.bookedMeeting.findMany({
        where: { hostId, startsAt: { gte: startOfToday } },
        orderBy: { startsAt: 'asc' },
        take: 10,
        include: { eventType: true }
      }),
      prisma.scheduledMeeting.findMany({
        where: { hostId, startsAt: { gte: startOfToday } },
        orderBy: { startsAt: 'asc' },
        take: 10
      })
    ]);

    const agenda: (AgendaItem & { startsAt: Date })[] = [
      ...booked.map(b => ({
        id: b.id,
        time: formatTime(b.startsAt),
        date: formatDate(b.startsAt),
        title: b.eventType.eventName,
        client: b.guestName,
        duration: `${b.eventType.durationMinutes} min`,
        startsAt: b.startsAt
      })),
      ...scheduled.map(s => ({
        id: s.id,
        time: formatTime(s.startsAt),
        date: formatDate(s.startsAt),
        title: s.title,
        client: s.guestName,
        duration: s.eventTypeLabel,
        startsAt: s.startsAt
      }))
    ];

    const sortedAgenda = agenda
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, 10)
      .map(({ startsAt, ...rest }) => rest);

    return NextResponse.json(sortedAgenda);
  } catch (error) {
    console.error("[api/dashboard/agenda][GET]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard agenda." }, { status: 500 });
  }
}

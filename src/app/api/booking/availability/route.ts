import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import type { WeeklyAvailabilityRow } from "@/lib/availability-api";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const DAYS: Array<{ dayOfWeek: number; dayLabel: string; startTime: string; endTime: string; enabled: boolean }> = [
  { dayOfWeek: 1, dayLabel: "Monday", startTime: "09:00", endTime: "18:00", enabled: true },
  { dayOfWeek: 2, dayLabel: "Tuesday", startTime: "09:00", endTime: "18:00", enabled: true },
  { dayOfWeek: 3, dayLabel: "Wednesday", startTime: "09:00", endTime: "18:00", enabled: true },
  { dayOfWeek: 4, dayLabel: "Thursday", startTime: "09:00", endTime: "18:00", enabled: true },
  { dayOfWeek: 5, dayLabel: "Friday", startTime: "09:00", endTime: "17:00", enabled: true },
  { dayOfWeek: 6, dayLabel: "Saturday", startTime: "09:00", endTime: "13:00", enabled: false },
  { dayOfWeek: 7, dayLabel: "Sunday", startTime: "09:00", endTime: "13:00", enabled: false },
];

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
    return parse(m.workspace_id) ?? parse(m.wid);
  }
  return null;
}

async function nextWorkspaceId(prisma: NonNullable<ReturnType<typeof getPrisma>>): Promise<number> {
  const agg = await prisma.userProfile.aggregate({ _max: { wid: true } });
  return (agg._max.wid ?? 0) + 1;
}

async function ensureProfileAndWid(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  authUser: { id: string; email?: string | null; user_metadata?: unknown },
): Promise<number> {
  const existing = await prisma.userProfile.findUnique({
    where: { id: authUser.id },
    select: { wid: true, email: true, fullName: true },
  });
  const name =
    (authUser.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined;
  const nextEmail = authUser.email ?? "";
  const nextName = name?.trim() || authUser.email?.split("@")[0] || "User";
  if (existing) {
    if (existing.email !== nextEmail || existing.fullName !== nextName) {
      await prisma.userProfile.update({
        where: { id: authUser.id },
        data: { email: nextEmail, fullName: nextName },
      });
    }
    return existing.wid;
  }

  const requestedWid = workspaceIdFromMeta(authUser.user_metadata);
  let wid = requestedWid ?? (await nextWorkspaceId(prisma));
  if (requestedWid) {
    const used = await prisma.userProfile.findFirst({ where: { wid: requestedWid } });
    if (used) wid = await nextWorkspaceId(prisma);
  }
  await prisma.userProfile.create({
    data: {
      id: authUser.id,
      email: nextEmail,
      fullName: nextName,
      wid,
    },
  });
  return wid;
}

function toRow(dayOfWeek: number, enabled: boolean, startTime: string, endTime: string): WeeklyAvailabilityRow {
  const dayLabel = DAYS.find((d) => d.dayOfWeek === dayOfWeek)?.dayLabel ?? "Unknown";
  return { dayOfWeek, dayLabel, enabled, startTime, endTime };
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

/**
 * GET — read weekly availability (filtered by user's wid).
 */
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: u, error: authError } = await supabase.auth.getUser(token);
  const authUser = u.user;
  if (authError || !authUser?.id) return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const wid = await ensureProfileAndWid(prisma, {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });
    const rows = await prisma.availabilityWeeklyHour.findMany({
      where: { hostId: authUser.id, wid },
      orderBy: { dayOfWeek: "asc" },
    });

    if (rows.length === 0) {
      return NextResponse.json(
        DAYS.map((d) => toRow(d.dayOfWeek, d.enabled, d.startTime, d.endTime)),
      );
    }

    return NextResponse.json(
      rows.map((r) => toRow(r.dayOfWeek, r.enabled, r.startTime, r.endTime)),
    );
  } catch (e) {
    console.error("[api/booking/availability][GET]", e);
    return NextResponse.json({ error: "Failed to load availability." }, { status: 500 });
  }
}

/**
 * PUT — replace weekly availability rows for the authenticated host + wid.
 */
export async function PUT(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: u, error: authError } = await supabase.auth.getUser(token);
  const authUser = u.user;
  if (authError || !authUser?.id) return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });

  let body: { rows?: WeeklyAvailabilityRow[] };
  try {
    body = (await req.json()) as { rows?: WeeklyAvailabilityRow[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const rows = body.rows;
  if (!Array.isArray(rows) || rows.length !== 7) {
    return NextResponse.json({ error: "rows must contain 7 day entries." }, { status: 400 });
  }
  for (const row of rows) {
    if (
      !Number.isInteger(row.dayOfWeek) ||
      row.dayOfWeek < 1 ||
      row.dayOfWeek > 7 ||
      typeof row.enabled !== "boolean" ||
      !isValidTime(row.startTime) ||
      !isValidTime(row.endTime)
    ) {
      return NextResponse.json({ error: "Invalid row format." }, { status: 400 });
    }
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const wid = await ensureProfileAndWid(prisma, {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });
    await prisma.$transaction([
      prisma.availabilityWeeklyHour.deleteMany({ where: { hostId: authUser.id, wid } }),
      prisma.availabilityWeeklyHour.createMany({
        data: rows.map((row) => ({
          hostId: authUser.id,
          wid,
          dayOfWeek: row.dayOfWeek,
          enabled: row.enabled,
          startTime: row.startTime,
          endTime: row.endTime,
        })),
      }),
    ]);
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[api/booking/availability][PUT]", e);
    return NextResponse.json({ error: "Failed to update availability." }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type OverrideInput = {
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  isAllDay?: boolean;
  label?: string | null;
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

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function parseDateOnly(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveAuth(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return { error: NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 }) };

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return { error: NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 }) };

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: u, error: authError } = await supabase.auth.getUser(token);
  const authUser = u.user;
  if (authError || !authUser?.id) return { error: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }) };

  const prisma = getPrisma();
  if (!prisma) return { error: NextResponse.json({ error: "Database is not configured." }, { status: 503 }) };

  const wid = await ensureProfileAndWid(prisma, {
    id: authUser.id,
    email: authUser.email,
    user_metadata: authUser.user_metadata,
  });
  return { prisma, authUser, wid };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveAuth(req);
    if ("error" in resolved) return resolved.error;
    const { prisma, authUser, wid } = resolved;
    const rows = await prisma.availabilityOverride.findMany({
      where: { hostId: authUser.id, wid },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        startTime: r.startTime,
        endTime: r.endTime,
        isAllDay: r.isAllDay,
        label: r.label,
      })),
    );
  } catch (e) {
    console.error("[api/booking/availability-overrides][GET]", e);
    return NextResponse.json({ error: "Failed to load overrides." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: OverrideInput;
  try {
    body = (await req.json()) as OverrideInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const dateStr = body.date?.trim() ?? "";
  const date = parseDateOnly(dateStr);
  const isAllDay = Boolean(body.isAllDay);
  const startTime = body.startTime?.trim() ?? null;
  const endTime = body.endTime?.trim() ?? null;

  if (!date) return NextResponse.json({ error: "date must be YYYY-MM-DD." }, { status: 400 });
  if (!isAllDay) {
    if (!startTime || !endTime || !isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
      return NextResponse.json({ error: "Valid startTime/endTime are required when isAllDay=false." }, { status: 400 });
    }
  }

  try {
    const resolved = await resolveAuth(req);
    if ("error" in resolved) return resolved.error;
    const { prisma, authUser, wid } = resolved;
    const created = await prisma.availabilityOverride.create({
      data: {
        hostId: authUser.id,
        wid,
        date,
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
        isAllDay,
        label: body.label?.trim() || null,
      },
    });
    return NextResponse.json(
      {
        id: created.id,
        date: created.date.toISOString().slice(0, 10),
        startTime: created.startTime,
        endTime: created.endTime,
        isAllDay: created.isAllDay,
        label: created.label,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[api/booking/availability-overrides][POST]", e);
    return NextResponse.json({ error: "Failed to create override." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  try {
    const resolved = await resolveAuth(req);
    if ("error" in resolved) return resolved.error;
    const { prisma, authUser, wid } = resolved;
    await prisma.availabilityOverride.deleteMany({
      where: { id, hostId: authUser.id, wid },
    });
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[api/booking/availability-overrides][DELETE]", e);
    return NextResponse.json({ error: "Failed to delete override." }, { status: 500 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { schedulingTypeIdToBookingKind } from "@/lib/booking-kind";
import type { CreateBookingEventTypeInput } from "@/lib/booking-event-types-api";
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

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function isSchedulingKind(value: string): value is CreateBookingEventTypeInput["kind"] {
  return value === "one-on-one" || value === "group" || value === "round-robin";
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

function parsePayload(input: unknown): CreateBookingEventTypeInput | null {
  if (!input || typeof input !== "object") return null;
  const b = input as Record<string, unknown>;
  if (!isSchedulingKind(String(b.kind ?? ""))) return null;
  if (typeof b.eventName !== "string" || !b.eventName.trim()) return null;

  const weekSlotsRaw = Array.isArray(b.weekSlots) ? b.weekSlots : null;
  if (!weekSlotsRaw || weekSlotsRaw.length === 0) return null;
  const weekSlots = weekSlotsRaw
    .map((slot) => slot as Record<string, unknown>)
    .filter(
      (s) =>
        typeof s.dayKey === "string" &&
        typeof s.enabled === "boolean" &&
        typeof s.startTime === "string" &&
        typeof s.endTime === "string" &&
        isValidTime(String(s.startTime)) &&
        isValidTime(String(s.endTime)),
    )
    .map((s) => ({
      dayKey: String(s.dayKey),
      enabled: Boolean(s.enabled),
      startTime: String(s.startTime),
      endTime: String(s.endTime),
    }));

  if (weekSlots.length !== weekSlotsRaw.length) return null;

  return {
    kind: String(b.kind) as CreateBookingEventTypeInput["kind"],
    eventName: String(b.eventName).trim(),
    durationMinutes: Number(b.durationMinutes),
    location: String(b.location ?? ""),
    description: typeof b.description === "string" ? b.description : undefined,
    availabilityPreset: String(b.availabilityPreset ?? ""),
    minNotice: String(b.minNotice ?? ""),
    bufferBeforeMinutes: Number(b.bufferBeforeMinutes),
    bufferAfterMinutes: Number(b.bufferAfterMinutes),
    bookingWindow: String(b.bookingWindow ?? ""),
    bookingQuestion: typeof b.bookingQuestion === "string" ? b.bookingQuestion : undefined,
    weekSlots,
  };
}

/**
 * POST — save an event type configuration from the scheduling drawer.
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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = parsePayload(raw);
  if (!payload) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  if (!Number.isFinite(payload.durationMinutes) || payload.durationMinutes <= 0) {
    return NextResponse.json({ error: "durationMinutes must be a positive number." }, { status: 400 });
  }
  if (!Number.isFinite(payload.bufferBeforeMinutes) || payload.bufferBeforeMinutes < 0) {
    return NextResponse.json({ error: "bufferBeforeMinutes must be >= 0." }, { status: 400 });
  }
  if (!Number.isFinite(payload.bufferAfterMinutes) || payload.bufferAfterMinutes < 0) {
    return NextResponse.json({ error: "bufferAfterMinutes must be >= 0." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  const bookingEventTypeModel = (prisma as unknown as { bookingEventType?: { create: Function } })
    .bookingEventType;
  if (!bookingEventTypeModel) {
    return NextResponse.json(
      {
        error: "Prisma client is out of date for booking models.",
        detail: "Restart dev server and run `npx prisma generate` so bookingEventType exists.",
      },
      { status: 503 },
    );
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

    const created = await bookingEventTypeModel.create({
      data: {
        hostId: authUser.id,
        wid,
        kind: schedulingTypeIdToBookingKind(payload.kind),
        eventName: payload.eventName,
        durationMinutes: Math.trunc(payload.durationMinutes),
        location: payload.location,
        description: payload.description?.trim() || null,
        availabilityPreset: payload.availabilityPreset,
        minNotice: payload.minNotice,
        bufferBeforeMinutes: Math.trunc(payload.bufferBeforeMinutes),
        bufferAfterMinutes: Math.trunc(payload.bufferAfterMinutes),
        bookingWindow: payload.bookingWindow,
        bookingQuestion: payload.bookingQuestion?.trim() || null,
        weekSlots: {
          create: payload.weekSlots.map((slot) => ({
            dayKey: slot.dayKey,
            enabled: slot.enabled,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        },
      },
      select: { id: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[api/booking/event-types]", e);
    return NextResponse.json(
      {
        error: "Failed to save event type.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

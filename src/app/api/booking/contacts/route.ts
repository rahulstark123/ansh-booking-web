import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

type CreateContactBody = {
  fullName?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  notes?: string;
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
    const direct = parse(m.workspace_id);
    if (direct) return direct;
    const alt = parse(m.wid);
    if (alt) return alt;
  }
  return null;
}

async function nextWorkspaceId(prisma: NonNullable<ReturnType<typeof getPrisma>>): Promise<number> {
  const agg = await prisma.userProfile.aggregate({ _max: { wid: true } });
  return (agg._max.wid ?? 0) + 1;
}

async function authHost(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return { error: NextResponse.json({ error: "Missing or invalid Authorization header." }, { status: 401 }) };

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return { error: NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 }) };

  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !authUser?.id) {
    return { error: NextResponse.json({ error: "Invalid or expired session." }, { status: 401 }) };
  }
  return { authUser };
}

export async function GET(req: NextRequest) {
  const auth = await authHost(req);
  if ("error" in auth) return auth.error;

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const rawPage = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const rawPageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "10");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(50, Math.max(1, Math.floor(rawPageSize))) : 10;
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const filter = req.nextUrl.searchParams.get("filter")?.trim() ?? "all";

    const wid =
      (await prisma.userProfile.findUnique({ where: { id: auth.authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(auth.authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));

    const where: Prisma.ContactWhereInput = {
      hostId: auth.authUser.id,
      wid,
    };
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filter === "No meetings") {
      where.lastBookedAt = null;
    } else if (filter === "Warm" || filter === "VIP" || filter === "Trial") {
      where.lastBookedAt = { not: null };
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
      where,
      orderBy: [{ lastBookedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return NextResponse.json({
      items: contacts,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (e) {
    console.error("[api/booking/contacts][GET]", e);
    return NextResponse.json({ error: "Failed to load contacts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authHost(req);
  if ("error" in auth) return auth.error;

  let body: CreateContactBody;
  try {
    body = (await req.json()) as CreateContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const countryCode = body.countryCode?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const notes = body.notes?.trim() ?? "";
  if (!fullName || !email) {
    return NextResponse.json({ error: "fullName and email are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email must be a valid email." }, { status: 400 });
  }
  if (countryCode && !/^\+\d{1,4}$/.test(countryCode)) {
    return NextResponse.json({ error: "countryCode format is invalid." }, { status: 400 });
  }
  if (phone && !/^[\d\s()-]{6,20}$/.test(phone)) {
    return NextResponse.json({ error: "phone format is invalid." }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const wid =
      (await prisma.userProfile.findUnique({ where: { id: auth.authUser.id }, select: { wid: true } }))?.wid ??
      workspaceIdFromMeta(auth.authUser.user_metadata) ??
      (await nextWorkspaceId(prisma));

    const contact = await prisma.contact.upsert({
      where: { hostId_email: { hostId: auth.authUser.id, email } },
      update: {
        fullName,
        countryCode: countryCode || null,
        phone: phone || null,
        notes: notes || null,
      },
      create: {
        hostId: auth.authUser.id,
        wid,
        fullName,
        email,
        countryCode: countryCode || null,
        phone: phone || null,
        notes: notes || null,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    console.error("[api/booking/contacts][POST]", e);
    return NextResponse.json({ error: "Failed to save contact." }, { status: 500 });
  }
}

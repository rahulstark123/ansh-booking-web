import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase config missing" }, { status: 503 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "DB config missing" }, { status: 503 });

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { linkSlug: true }
    });
    return NextResponse.json({ linkSlug: profile?.linkSlug || "" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch link slug" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase config missing" }, { status: 503 });

  const supabase = createClient(cfg.url, cfg.anonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "DB config missing" }, { status: 503 });

  try {
    const body = await req.json();
    const { linkSlug } = body;
    
    // check if slug is taken
    if (linkSlug) {
      const existing = await prisma.userProfile.findFirst({
        where: { linkSlug, id: { not: user.id } }
      });
      if (existing) {
        return NextResponse.json({ error: "Slug is already taken" }, { status: 400 });
      }
    }

    const updated = await prisma.userProfile.update({
      where: { id: user.id },
      data: { linkSlug },
      select: { linkSlug: true }
    });

    return NextResponse.json({ linkSlug: updated.linkSlug || "" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update link slug" }, { status: 500 });
  }
}

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

    const profile = await prisma.userProfile.findUnique({
      where: { id: hostId },
      select: {
        platformBranding: true,
        workspaceLogo: true,
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      usePlatformBranding: profile.platformBranding,
      workspaceLogo: profile.workspaceLogo,
    });
  } catch (error) {
    console.error("[api/dashboard/settings/branding][GET]", error);
    return NextResponse.json({ error: "Failed to fetch branding settings." }, { status: 500 });
  }
}

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

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const hostId = authUser.id;
    const body = await req.json();

    const { usePlatformBranding, workspaceLogo } = body;

    const updated = await prisma.userProfile.update({
      where: { id: hostId },
      data: {
        ...(typeof usePlatformBranding === 'boolean' && { platformBranding: usePlatformBranding }),
        ...(workspaceLogo !== undefined && { workspaceLogo }),
      },
      select: {
        platformBranding: true,
        workspaceLogo: true,
      }
    });

    return NextResponse.json({
      usePlatformBranding: updated.platformBranding,
      workspaceLogo: updated.workspaceLogo,
    });
  } catch (error) {
    console.error("[api/dashboard/settings/branding][PATCH]", error);
    return NextResponse.json({ error: "Failed to update branding settings." }, { status: 500 });
  }
}

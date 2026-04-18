import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { isZoomOAuthConfigured } from "@/lib/zoom";

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
  return h.slice(7).trim() || null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cfg = supabaseUrlAndAnonKey();
  if (!cfg) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const supabase = createClient(cfg.url, cfg.anonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const zoom = await prisma.integrationConnection.findUnique({
      where: { hostId_provider: { hostId: user.id, provider: "ZOOM" } },
      select: { id: true, expiresAt: true, updatedAt: true },
    });
    return NextResponse.json({
      zoomOAuthConfigured: isZoomOAuthConfigured(),
      zoomConnected: Boolean(zoom),
      zoomExpiresAt: zoom?.expiresAt ?? null,
      zoomUpdatedAt: zoom?.updatedAt ?? null,
    });
  } catch (e) {
    console.error("[api/integrations/zoom/status]", e);
    return NextResponse.json({
      zoomOAuthConfigured: isZoomOAuthConfigured(),
      zoomConnected: false,
      zoomExpiresAt: null,
      zoomUpdatedAt: null,
    });
  }
}

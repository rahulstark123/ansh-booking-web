import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

import { buildZoomAuthUrl, createZoomPkcePair, isZoomOAuthConfigured } from "@/lib/zoom";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

/** Browsers ignore `Secure` cookies on http://localhost — OAuth callbacks would miss state/PKCE. */
const oauthCookieSecure = process.env.NODE_ENV === "production";

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

export async function POST(req: NextRequest) {
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

  if (!isZoomOAuthConfigured()) {
    return NextResponse.json({ error: "Zoom OAuth is not configured on server." }, { status: 503 });
  }

  const state = randomUUID();
  const { codeVerifier, codeChallenge } = createZoomPkcePair();
  const authUrl = buildZoomAuthUrl(state, codeChallenge);
  if (!authUrl) return NextResponse.json({ error: "Zoom OAuth not configured." }, { status: 503 });

  const res = NextResponse.json({ authUrl });
  res.cookies.set("zoom_oauth_pkce", codeVerifier, {
    httpOnly: true,
    secure: oauthCookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("zoom_oauth_state", state, {
    httpOnly: true,
    secure: oauthCookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("zoom_oauth_user", user.id, {
    httpOnly: true,
    secure: oauthCookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

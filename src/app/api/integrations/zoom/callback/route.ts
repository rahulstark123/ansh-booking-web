import { NextResponse, type NextRequest } from "next/server";

import { exchangeZoomCode } from "@/lib/zoom";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const oauthCookieSecure = process.env.NODE_ENV === "production";

function clearCookies(res: NextResponse) {
  const clear = { path: "/", maxAge: 0, secure: oauthCookieSecure, sameSite: "lax" as const };
  res.cookies.set("zoom_oauth_pkce", "", clear);
  res.cookies.set("zoom_oauth_state", "", clear);
  res.cookies.set("zoom_oauth_user", "", clear);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const appBase =
    (process.env.NODE_ENV !== "production" ? process.env.APP_BASE_URL_LOCAL : process.env.APP_BASE_URL) ||
    url.origin;

  if (error) {
    console.error("[zoom/callback] Zoom returned error:", error, url.searchParams.get("error_description"));
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=error`);
    clearCookies(res);
    return res;
  }
  const stateCookie = req.cookies.get("zoom_oauth_state")?.value ?? "";
  const userId = req.cookies.get("zoom_oauth_user")?.value ?? "";
  const codeVerifier = req.cookies.get("zoom_oauth_pkce")?.value ?? "";
  if (!code || !state || !userId || !codeVerifier || stateCookie !== state) {
    console.error("[zoom/callback] Missing OAuth session cookies or bad state.", {
      hasCode: Boolean(code),
      stateMatch: stateCookie === state && Boolean(state),
      hasUserCookie: Boolean(userId),
      hasPkceCookie: Boolean(codeVerifier),
    });
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=error`);
    clearCookies(res);
    return res;
  }

  const prisma = getPrisma();
  if (!prisma) {
    console.error("[zoom/callback] Prisma not configured (DATABASE_URL / getPrisma).");
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=error`);
    clearCookies(res);
    return res;
  }

  try {
    const token = await exchangeZoomCode(code, codeVerifier);
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { wid: true },
    });
    if (!profile?.wid) {
      console.error("[zoom/callback] No userProfile for hostId from cookie:", userId);
      const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=error`);
      clearCookies(res);
      return res;
    }
    await prisma.integrationConnection.upsert({
      where: {
        hostId_provider: {
          hostId: userId,
          provider: "ZOOM",
        },
      },
      update: {
        wid: profile.wid,
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? undefined,
        scope: token.scope ?? null,
        expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      },
      create: {
        hostId: userId,
        wid: profile.wid,
        provider: "ZOOM",
        accessToken: token.access_token,
        refreshToken: token.refresh_token ?? null,
        scope: token.scope ?? null,
        expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      },
    });
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=connected`);
    clearCookies(res);
    return res;
  } catch (e) {
    console.error("[zoom/callback] Token exchange or DB save failed:", e);
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?zoom=error`);
    clearCookies(res);
    return res;
  }
}

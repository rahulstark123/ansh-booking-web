import { NextResponse, type NextRequest } from "next/server";

import { exchangeGoogleCode } from "@/lib/google-meet";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function clearCookies(res: NextResponse) {
  res.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("google_oauth_user", "", { path: "/", maxAge: 0 });
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
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=error`);
    clearCookies(res);
    return res;
  }
  const stateCookie = req.cookies.get("google_oauth_state")?.value ?? "";
  const userId = req.cookies.get("google_oauth_user")?.value ?? "";
  if (!code || !state || !userId || stateCookie !== state) {
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=error`);
    clearCookies(res);
    return res;
  }

  const prisma = getPrisma();
  if (!prisma) {
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=error`);
    clearCookies(res);
    return res;
  }

  try {
    const token = await exchangeGoogleCode(code);
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { wid: true },
    });
    if (!profile?.wid) {
      const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=error`);
      clearCookies(res);
      return res;
    }
    await prisma.integrationConnection.upsert({
      where: {
        hostId_provider: {
          hostId: userId,
          provider: "GOOGLE",
        },
      },
      update: {
        wid: profile.wid,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        scope: token.scope ?? null,
        expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      },
      create: {
        hostId: userId,
        wid: profile.wid,
        provider: "GOOGLE",
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        scope: token.scope ?? null,
        expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      },
    });
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=connected`);
    clearCookies(res);
    return res;
  } catch {
    const res = NextResponse.redirect(`${appBase}/dashboard/integrations?google=error`);
    clearCookies(res);
    return res;
  }
}

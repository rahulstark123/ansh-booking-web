import { createHash, randomBytes } from "crypto";

import { buildVirtualMeetingLink } from "@/lib/virtual-meeting-link";
import { getPrisma } from "@/lib/prisma";

/**
 * Zoom: User-authorized OAuth 2.0 (authorization code + optional PKCE), same class of flow as Google Meet.
 * Uses /oauth/authorize → /oauth/token with grant_type=authorization_code and refresh_token rotation.
 *
 * Not supported here: Server-to-Server OAuth (account_credentials + Account ID) — different app type on Zoom Marketplace.
 * @see https://developers.zoom.us/docs/integrations/oauth/
 * @see https://developers.zoom.us/blog/pcke-oauth-with-postman-rest-api/
 */

type ZoomTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type ZoomMeetingCreateResponse = {
  join_url?: string;
};

export type ZoomMeetingInput = {
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  attendees?: string[];
};

/** Zoom matches redirect_uri to the allow list exactly; trim accidental trailing slash on path only. */
function normalizeRedirectUri(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.href;
  } catch {
    return trimmed;
  }
}

function zoomRedirectUri(): string {
  const isDev = process.env.NODE_ENV !== "production";
  // Local dev: use localhost callback by default so Zoom allow list matches (not production URL).
  if (isDev) {
    if (process.env.ZOOM_USE_PRODUCTION_ZOOM_REDIRECT === "true" && process.env.ZOOM_REDIRECT_URI?.trim()) {
      return normalizeRedirectUri(process.env.ZOOM_REDIRECT_URI);
    }
    return normalizeRedirectUri(
      process.env.ZOOM_REDIRECT_URI_LOCAL?.trim() ?? "http://localhost:3000/api/integrations/zoom/callback",
    );
  }
  const fromEnv =
    process.env.ZOOM_REDIRECT_URI?.trim() ??
    process.env.ZOOM_REDIRECT_URI_LOCAL?.trim() ??
    "http://localhost:3000/api/integrations/zoom/callback";
  return normalizeRedirectUri(fromEnv);
}

function zoomClientId(): string | null {
  return process.env.ZOOM_CLIENT_ID?.trim() || null;
}

function zoomClientSecret(): string | null {
  return process.env.ZOOM_CLIENT_SECRET?.trim() || null;
}

function zoomOAuthScopes(): string {
  return (
    process.env.ZOOM_OAUTH_SCOPES?.trim() ||
    "user:read:user meeting:write:meeting"
  );
}

function basicAuthHeader(): string {
  const id = zoomClientId() ?? "";
  const secret = zoomClientSecret() ?? "";
  return `Basic ${Buffer.from(`${id}:${secret}`, "utf8").toString("base64")}`;
}

export function isZoomOAuthConfigured(): boolean {
  return Boolean(zoomClientId() && zoomClientSecret());
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** RFC 7636 PKCE pair; Zoom supports S256 on the user authorization flow (recommended for auth-code exchanges). */
export function createZoomPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash("sha256").update(codeVerifier, "utf8").digest());
  return { codeVerifier, codeChallenge };
}

export function buildZoomAuthUrl(state: string, codeChallenge: string): string | null {
  const clientId = zoomClientId();
  if (!clientId) return null;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: zoomRedirectUri(),
    state,
    scope: zoomOAuthScopes(),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

export async function exchangeZoomCode(code: string, codeVerifier: string): Promise<ZoomTokenResponse> {
  const clientId = zoomClientId();
  const clientSecret = zoomClientSecret();
  if (!clientId || !clientSecret) throw new Error("Zoom OAuth is not configured.");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: zoomRedirectUri(),
    code_verifier: codeVerifier,
  });
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Zoom token exchange failed (${res.status})`);
  return (await res.json()) as ZoomTokenResponse;
}

async function refreshZoomToken(refreshToken: string): Promise<ZoomTokenResponse> {
  const clientId = zoomClientId();
  const clientSecret = zoomClientSecret();
  if (!clientId || !clientSecret) throw new Error("Zoom OAuth is not configured.");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Zoom token refresh failed (${res.status})`);
  return (await res.json()) as ZoomTokenResponse;
}

/** Best-effort revoke (refresh token preferred) when user disconnects. */
export async function revokeZoomToken(token: string): Promise<void> {
  const clientId = zoomClientId();
  const clientSecret = zoomClientSecret();
  if (!clientId || !clientSecret || !token.trim()) return;
  const body = new URLSearchParams({ token: token.trim() });
  await fetch("https://zoom.us/oauth/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: body.toString(),
    cache: "no-store",
  }).catch(() => {});
}

function zoomUtcStartTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function meetingDurationMinutes(startsAt: Date, endsAt: Date): number {
  const n = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  return Math.max(1, n);
}

async function createZoomMeeting(accessToken: string, input: ZoomMeetingInput): Promise<string | null> {
  const duration = meetingDurationMinutes(input.startsAt, input.endsAt);
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.summary,
      type: 2,
      start_time: zoomUtcStartTime(input.startsAt),
      duration,
      timezone: "UTC",
      agenda: input.description,
      settings: {
        waiting_room: true,
        join_before_host: false,
        mute_upon_entry: true,
        participant_video: true,
      }
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const payload = (await res.json()) as ZoomMeetingCreateResponse;
  return payload.join_url ?? null;
}

export async function generateZoomMeetingLinkForHost(
  hostId: string,
  wid: number,
  input: ZoomMeetingInput,
): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const conn = await prisma.integrationConnection.findUnique({
    where: {
      hostId_provider: {
        hostId,
        provider: "ZOOM",
      },
    },
  });
  if (!conn) return null;

  let accessToken = conn.accessToken;
  const exp = conn.expiresAt?.getTime() ?? 0;
  if (exp && exp <= Date.now() + 60 * 1000 && conn.refreshToken) {
    try {
      const refreshed = await refreshZoomToken(conn.refreshToken);
      accessToken = refreshed.access_token;
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          wid,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? conn.refreshToken,
          scope: refreshed.scope ?? conn.scope,
          expiresAt: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : conn.expiresAt,
        },
      });
    } catch {
      return null;
    }
  }

  const joinUrl = await createZoomMeeting(accessToken, input);
  return joinUrl;
}

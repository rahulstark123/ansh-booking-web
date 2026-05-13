import { randomUUID } from "crypto";

import { buildVirtualMeetingLink } from "@/lib/virtual-meeting-link";
import { getPrisma } from "@/lib/prisma";
import { generateZoomMeetingLinkForHost } from "@/lib/zoom";

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleCalendarEventResponse = {
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type GoogleMeetInput = {
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  attendees?: string[];
};

function googleRedirectUri(): string {
  if (process.env.NODE_ENV !== "production" && process.env.GOOGLE_REDIRECT_URI_LOCAL?.trim()) {
    return process.env.GOOGLE_REDIRECT_URI_LOCAL.trim();
  }
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ??
    process.env.GOOGLE_REDIRECT_URI_LOCAL?.trim() ??
    "http://localhost:3000/api/integrations/google/callback"
  );
}

function googleClientId(): string | null {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null;
}

function googleClientSecret(): string | null {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || null;
}

export function buildGoogleAuthUrl(state: string): string | null {
  const clientId = googleClientId();
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  return (await res.json()) as GoogleTokenResponse;
}

async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const clientId = googleClientId();
  const clientSecret = googleClientSecret();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status})`);
  return (await res.json()) as GoogleTokenResponse;
}

async function createGoogleMeetEventLink(accessToken: string, input: GoogleMeetInput): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startsAt.toISOString() },
        end: { dateTime: input.endsAt.toISOString() },
        attendees: (input.attendees ?? []).map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[google-meet] Failed to create event: ${res.status}`, errText);
    return null;
  }
  const payload = (await res.json()) as GoogleCalendarEventResponse;
  const entry = payload.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video");
  return payload.hangoutLink ?? entry?.uri ?? null;
}

export async function generateMeetingLinkForHost(
  hostId: string,
  wid: number,
  location: string,
  input: GoogleMeetInput,
): Promise<string | null> {
  if (location === "zoom") {
    const zoomLink = await generateZoomMeetingLinkForHost(hostId, wid, input);
    return zoomLink ?? buildVirtualMeetingLink(location);
  }
  if (location !== "google-meet") return buildVirtualMeetingLink(location);

  const prisma = getPrisma();
  if (!prisma) return buildVirtualMeetingLink(location);

  const conn = await prisma.integrationConnection.findUnique({
    where: {
      hostId_provider: {
        hostId,
        provider: "GOOGLE",
      },
    },
  });
  if (!conn) {
    console.warn(`[google-meet] No Google integration found for host ${hostId}. Falling back to virtual link.`);
    return buildVirtualMeetingLink(location);
  }

  let accessToken = conn.accessToken;
  const exp = conn.expiresAt?.getTime() ?? 0;
  if (exp && exp <= Date.now() + 60 * 1000 && conn.refreshToken) {
    try {
      const refreshed = await refreshGoogleToken(conn.refreshToken);
      accessToken = refreshed.access_token;
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          wid,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? conn.refreshToken,
          scope: refreshed.scope ?? conn.scope,
          expiresAt: refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000)
            : conn.expiresAt,
        },
      });
    } catch {
      return buildVirtualMeetingLink(location);
    }
  }

  const meetLink = await createGoogleMeetEventLink(accessToken, input);
  return meetLink ?? buildVirtualMeetingLink(location);
}

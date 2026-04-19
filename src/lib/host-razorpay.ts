import type { PrismaClient } from "@prisma/client";

import { getRazorpayInstanceFromKeys } from "@/lib/billing/razorpay";

/** Stored on `IntegrationConnection` for `provider === RAZORPAY`. */
export type HostRazorpayCredentials = {
  keyId: string;
  keySecret: string;
  /** Webhook signing secret from Razorpay Dashboard (optional until webhooks are configured). */
  webhookSecret: string | null;
};

export async function getHostRazorpayCredentials(
  prisma: PrismaClient,
  hostId: string,
): Promise<HostRazorpayCredentials | null> {
  try {
    const row = await prisma.integrationConnection.findUnique({
      where: { hostId_provider: { hostId, provider: "RAZORPAY" } },
      select: { accessToken: true, refreshToken: true, scope: true },
    });
    if (!row?.accessToken?.trim() || !row.refreshToken?.trim()) return null;
    return {
      keyId: row.accessToken.trim(),
      keySecret: row.refreshToken.trim(),
      webhookSecret: row.scope?.trim() || null,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // DB not migrated (`RAZORPAY` missing on enum) — treat as disconnected instead of 500 + retry storms.
    if (
      msg.includes("RAZORPAY") ||
      (msg.includes("IntegrationProvider") && msg.toLowerCase().includes("enum"))
    ) {
      console.warn(
        "[getHostRazorpayCredentials] Razorpay integration skipped (database enum/migration). Run: npx prisma migrate deploy",
      );
      return null;
    }
    throw e;
  }
}

export function getRazorpayFromHostCredentials(creds: HostRazorpayCredentials) {
  return getRazorpayInstanceFromKeys({ keyId: creds.keyId, keySecret: creds.keySecret });
}

/** Mask `rzp_live_xxxx` → `rzp_live_…` + last 4 */
export function maskRazorpayKeyId(keyId: string): string {
  const t = keyId.trim();
  if (t.length <= 12) return "••••";
  return `${t.slice(0, 10)}…${t.slice(-4)}`;
}

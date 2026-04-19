"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

async function authorizedGetJson(url: string): Promise<Record<string, unknown>> {
  const client = await getSupabaseBrowserClient();
  if (!client) throw new Error("no_client");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("no_session");
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export default function ConnectRazorpayPage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const statusQ = useQuery({
    queryKey: queryKeys.integrations.razorpayStatus(userId),
    queryFn: () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return authorizedGetJson(
        `/api/integrations/razorpay/status?origin=${encodeURIComponent(origin)}`,
      );
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    /** Status is cheap; on failure (401/500) do not hammer the API — user can refresh the page. */
    retry: false,
  });

  const connected = Boolean(statusQ.data?.razorpayConnected);
  const webhookUrl = typeof statusQ.data?.webhookUrl === "string" ? statusQ.data.webhookUrl : "";
  const keyPreview = typeof statusQ.data?.keyIdPreview === "string" ? statusQ.data.keyIdPreview : null;

  async function handleSave() {
    if (!keyId.trim() || !keySecret.trim()) {
      window.alert("Enter Key ID and Key Secret.");
      return;
    }
    setSaving(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) return;
      const res = await fetch("/api/integrations/razorpay/connect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyId: keyId.trim(),
          keySecret: keySecret.trim(),
          webhookSecret: webhookSecret.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        window.alert(body?.error || "Could not save.");
        return;
      }
      setKeySecret("");
      if (webhookSecret.trim()) setWebhookSecret("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.razorpayStatus(userId) });
      window.alert("Razorpay saved. Guests can now pay meeting fees on your booking links.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Remove Razorpay from your account? Paid bookings will stop working until you connect again.")) {
      return;
    }
    const client = await getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;
    await fetch("/api/integrations/razorpay/disconnect", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.razorpayStatus(userId) });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/dashboard/integrations"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--app-primary)] hover:underline"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        Back to Integrations
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Connect Razorpay</h1>
        <p className="mt-2 text-sm text-zinc-600">
          To accept meeting fees on your public booking pages, add the API keys from your own Razorpay account.
          Money settles in your Razorpay balance—not the platform&apos;s subscription keys.
        </p>

        {connected && keyPreview && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
            Connected: <span className="font-mono font-medium">{keyPreview}</span>
          </p>
        )}

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-800">Key ID</span>
            <input
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="e.g. rzp_test_…"
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Razorpay Dashboard → Account &amp; Settings → API Keys
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-800">Key Secret</span>
            <input
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder="Your secret key"
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
            />
            <span className="mt-1 block text-xs text-zinc-500">Keep this secret. Never share it in chat or email.</span>
          </label>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Webhook setup</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              In Razorpay Dashboard → Webhooks, add the URL below. Under{" "}
              <strong className="text-zinc-800">Active Events</strong>, enable{" "}
              <span className="font-mono font-medium text-zinc-800">order.paid</span> (required—it may appear under
              Order events; use the search box if you do not see it). Optionally also enable{" "}
              <span className="font-mono text-zinc-800">payment.captured</span> (under Payment events) for extra
              reconciliation. Then paste the <strong>webhook signing secret</strong> Razorpay shows after you create the
              webhook—this verifies callbacks are genuine.
            </p>
            {webhookUrl ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Webhook URL</p>
                <div className="mt-1 break-all rounded-md border border-zinc-200 bg-white px-2.5 py-2 font-mono text-[11px] leading-snug text-zinc-800">
                  {webhookUrl}
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[var(--app-primary)] hover:underline"
                  onClick={() => void navigator.clipboard.writeText(webhookUrl)}
                >
                  Copy URL
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-800">
                Set <span className="font-mono">NEXT_PUBLIC_APP_URL</span> to your site URL (e.g.{" "}
                https://yourdomain.com) so we can show the exact webhook link. You can still build it as:{" "}
                <span className="font-mono">
                  {"{your-site}"}/api/webhooks/razorpay?hostId={"{"}your-user-id{"}"}
                </span>
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-800">Webhook signing secret (recommended)</span>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="From Razorpay after creating the webhook"
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
            />
            <span className="mt-1 block text-xs text-zinc-500">
              Without this, webhooks cannot be verified. Saving keys still enables guest checkout.
            </span>
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {connected && (
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="order-2 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:order-1"
            >
              Disconnect
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="order-1 rounded-full bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:opacity-60 sm:order-2"
          >
            {saving ? "Saving…" : "Save integration"}
          </button>
        </div>
      </div>
    </div>
  );
}

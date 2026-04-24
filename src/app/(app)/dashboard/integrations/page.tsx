"use client";

import { CheckCircleIcon, LinkIcon, ArrowTopRightOnSquareIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { siCashapp, siGmail, siGooglemeet, siZoom } from "simple-icons/icons";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

type IntegrationKey = "gmail" | "google-meet" | "zoom" | "cashfree" | "razorpay";

type Integration = {
  key: IntegrationKey;
  name: string;
  category: string;
  description: string;
  iconPath: string;
  iconColor: string;
};

const INTEGRATIONS: Integration[] = [
  {
    key: "gmail",
    name: "Gmail",
    category: "Email",
    description: "Send confirmations and reminders from your connected Gmail account.",
    iconPath: siGmail.path,
    iconColor: `#${siGmail.hex}`,
  },
  {
    key: "google-meet",
    name: "Google Meet",
    category: "Video",
    description: "Automatically add Google Meet links when meetings are booked.",
    iconPath: siGooglemeet.path,
    iconColor: `#${siGooglemeet.hex}`,
  },
  {
    key: "zoom",
    name: "Zoom",
    category: "Video",
    description: "Create Zoom meeting links and sync host details with bookings.",
    iconPath: siZoom.path,
    iconColor: `#${siZoom.hex}`,
  },
  {
    key: "cashfree",
    name: "Cashfree",
    category: "Payments",
    description: "Process subscription payments securely through your Cashfree gateway setup.",
    iconPath: siCashapp.path,
    iconColor: `#${siCashapp.hex}`,
  },
  {
    key: "razorpay",
    name: "Razorpay",
    category: "Payments",
    description:
      "Connect your Razorpay account to charge meeting fees on public booking links.",
    iconPath: siCashapp.path,
    iconColor: "#0C2451",
  },
];

const INTEGRATION_STATUS_STALE_MS = 5 * 60 * 1000;

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

export default function IntegrationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? "";
  const [gmailMockOn, setGmailMockOn] = useState(false);

  const googleQ = useQuery({
    queryKey: queryKeys.integrations.googleStatus(userId),
    queryFn: () => authorizedGetJson("/api/integrations/google/status"),
    enabled: Boolean(userId),
    staleTime: INTEGRATION_STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const zoomQ = useQuery({
    queryKey: queryKeys.integrations.zoomStatus(userId),
    queryFn: () => authorizedGetJson("/api/integrations/zoom/status"),
    enabled: Boolean(userId),
    staleTime: INTEGRATION_STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const cashfreeQ = useQuery({
    queryKey: queryKeys.integrations.cashfreeStatus(userId),
    queryFn: () => authorizedGetJson("/api/integrations/cashfree/status"),
    enabled: Boolean(userId),
    staleTime: INTEGRATION_STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const razorpayQ = useQuery({
    queryKey: queryKeys.integrations.razorpayStatus(userId),
    queryFn: () =>
      authorizedGetJson(
        `/api/integrations/razorpay/status?origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`,
      ),
    enabled: Boolean(userId),
    staleTime: INTEGRATION_STATUS_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  });

  const googleConnected = Boolean(googleQ.data?.googleMeetConnected);
  const zoomConnected = Boolean(zoomQ.data?.zoomConnected);
  const zoomOAuthConfigured = Boolean(zoomQ.data?.zoomOAuthConfigured);
  const cashfreeConfigured = Boolean(cashfreeQ.data?.cashfreeConfigured);
  const cashfreeConnected = Boolean(cashfreeQ.data?.cashfreeConnected);
  const razorpayConnected = Boolean(razorpayQ.data?.razorpayConnected);

  const loadingGoogle = googleQ.isPending;
  const loadingZoom = zoomQ.isPending;
  const loadingCashfree = cashfreeQ.isPending;
  const loadingRazorpay = razorpayQ.isPending;

  const connected = useMemo(
    () =>
      ({
        gmail: gmailMockOn,
        "google-meet": googleConnected,
        zoom: zoomConnected,
        cashfree: cashfreeConnected,
        razorpay: razorpayConnected,
      }) satisfies Record<IntegrationKey, boolean>,
    [gmailMockOn, googleConnected, zoomConnected, cashfreeConnected, razorpayConnected],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const zoomResult = params.get("zoom");
    if (zoomResult !== "connected" && zoomResult !== "error") return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.integrations.root });
    const url = new URL(window.location.href);
    url.searchParams.delete("zoom");
    url.searchParams.delete("zoom_reason");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
    if (zoomResult === "error") {
      window.alert(`Zoom did not connect. Please check your settings.`);
    }
  }, [queryClient]);

  function toggleIntegration(key: IntegrationKey) {
    if (key === "gmail") setGmailMockOn((v) => !v);
  }

  async function toggleGoogleIntegration() {
    const client = await getSupabaseBrowserClient();
    if (!client || !userId) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (googleConnected) {
      await fetch("/api/integrations/google/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.googleStatus(userId) });
      return;
    }

    const res = await fetch("/api/integrations/google/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.authUrl) {
      window.location.href = body.authUrl;
    }
  }

  async function toggleZoomIntegration() {
    const client = await getSupabaseBrowserClient();
    if (!client || !userId) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (zoomConnected) {
      await fetch("/api/integrations/zoom/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.zoomStatus(userId) });
      return;
    }

    const res = await fetch("/api/integrations/zoom/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.authUrl) {
      window.location.href = body.authUrl;
      return;
    }
    window.alert(body?.error || "Could not start Zoom connection.");
  }

  async function toggleCashfreeIntegration() {
    const client = await getSupabaseBrowserClient();
    if (!client || !userId) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (cashfreeConnected) {
      await fetch("/api/integrations/cashfree/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.cashfreeStatus(userId) });
      return;
    }
    const res = await fetch("/api/integrations/cashfree/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.cashfreeStatus(userId) });
      return;
    }
    const body = await res.json().catch(() => null);
    window.alert(body?.error || "Could not connect Cashfree.");
  }

  async function toggleRazorpayIntegration() {
    const client = await getSupabaseBrowserClient();
    if (!client || !userId) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (razorpayConnected) {
      if (!window.confirm("Remove Razorpay? Meeting fees on booking pages will stop until you connect again.")) {
        return;
      }
      await fetch("/api/integrations/razorpay/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.integrations.razorpayStatus(userId) });
      return;
    }
    router.push("/dashboard/integrations/razorpay");
  }

  const connectedCount = useMemo(() => Object.values(connected).filter(Boolean).length, [connected]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-8 py-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Integrations</h1>
          <p className="mt-2 text-base text-zinc-500 max-w-2xl">
            Connect your workspace to the world. Synchronize calendars, automate video meeting links, and process payments effortlessly.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-zinc-200 shadow-sm">
          <CpuChipIcon className="h-5 w-5 text-[var(--app-primary)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">Status</span>
            <span className="text-sm font-bold text-zinc-900 mt-1">
              {connectedCount} / {INTEGRATIONS.length} <span className="text-zinc-400 font-medium">Connected</span>
            </span>
          </div>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((item, idx) => {
          const isConnected = connected[item.key];
          const isLoading = 
            (item.key === "google-meet" && loadingGoogle) ||
            (item.key === "zoom" && loadingZoom) ||
            (item.key === "cashfree" && loadingCashfree) ||
            (item.key === "razorpay" && loadingRazorpay);

          return (
            <motion.article 
              key={item.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-[var(--app-primary-soft)] hover:-translate-y-1"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 ring-1 ring-zinc-100 transition-all group-hover:scale-110 group-hover:shadow-md">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    role="img"
                    aria-hidden
                  >
                    <path d={item.iconPath} fill={item.iconColor} />
                  </svg>
                </div>

                <div className={[
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  isConnected
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                    : "bg-zinc-50 text-zinc-400 ring-1 ring-zinc-200/50",
                ].join(" ")}>
                  {isConnected ? (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Connected
                    </>
                  ) : "Inactive"}
                </div>
              </div>

              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-zinc-900 group-hover:text-[var(--app-primary)] transition-colors">{item.name}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{item.category}</p>
              </div>

              <p className="mb-8 flex-grow text-sm font-medium leading-relaxed text-zinc-500">
                {item.description}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    item.key === "google-meet"
                      ? toggleGoogleIntegration()
                      : item.key === "zoom"
                        ? toggleZoomIntegration()
                        :                     item.key === "cashfree"
                          ? toggleCashfreeIntegration()
                          : item.key === "razorpay"
                            ? void toggleRazorpayIntegration()
                            : toggleIntegration(item.key)
                  }
                  disabled={
                    isLoading ||
                    (item.key === "zoom" && !zoomOAuthConfigured) ||
                    (item.key === "cashfree" && !cashfreeConfigured)
                  }
                  className={[
                    "flex-grow rounded-2xl px-4 py-3 text-xs font-bold transition-all active:scale-[0.98]",
                    isConnected
                      ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      : "bg-[var(--app-primary)] text-white shadow-lg shadow-[var(--app-primary-soft)] hover:bg-[var(--app-primary-hover)]",
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  ].join(" ")}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Syncing...
                    </span>
                  ) : item.key === "zoom" && !zoomOAuthConfigured ? (
                    "Environment missing"
                  ) : item.key === "cashfree" && !cashfreeConfigured ? (
                    "Environment missing"
                  ) : isConnected ? (
                    "Disconnect"
                  ) : (
                    "Connect Account"
                  )}
                </button>

                {isConnected && item.key === "razorpay" && (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/integrations/razorpay")}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-zinc-200 text-zinc-500 transition-all hover:bg-zinc-50 hover:text-[var(--app-primary)] hover:border-[var(--app-primary)]"
                    title="Configure details"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* Help Section */}
      <div className="rounded-3xl bg-zinc-900 p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <LinkIcon className="h-32 w-32 -rotate-12" />
        </div>
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-bold">Need a specific integration?</h3>
          <p className="mt-2 text-zinc-400 font-medium">
            We are constantly expanding our ecosystem. If you need a custom webhook or a specific CRM sync, please let us know.
          </p>
          <button className="mt-6 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold transition-all hover:bg-white/20 active:scale-95">
            Request Integration
          </button>
        </div>
      </div>
    </motion.div>
  );
}

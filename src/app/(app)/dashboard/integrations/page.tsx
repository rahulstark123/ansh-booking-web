"use client";

import { CheckCircleIcon, LinkIcon } from "@heroicons/react/24/outline";
import { siCashapp, siGmail, siGooglemeet, siZoom } from "simple-icons/icons";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type IntegrationKey = "gmail" | "google-meet" | "zoom" | "cashfree";

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
];

export default function IntegrationsPage() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [zoomConnected, setZoomConnected] = useState(false);
  const [zoomOAuthConfigured, setZoomOAuthConfigured] = useState(false);
  const [loadingZoom, setLoadingZoom] = useState(true);
  const [cashfreeConfigured, setCashfreeConfigured] = useState(false);
  const [loadingCashfree, setLoadingCashfree] = useState(true);
  const [connected, setConnected] = useState<Record<IntegrationKey, boolean>>({
    gmail: false,
    "google-meet": false,
    zoom: false,
    cashfree: false,
  });

  async function loadGoogleStatus() {
    setLoadingGoogle(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) return;
      const res = await fetch("/api/integrations/google/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setGoogleConnected(Boolean(body?.googleMeetConnected));
      }
    } finally {
      setLoadingGoogle(false);
    }
  }

  useEffect(() => {
    loadGoogleStatus();
  }, []);

  async function loadZoomStatus() {
    setLoadingZoom(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) return;
      const res = await fetch("/api/integrations/zoom/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setZoomOAuthConfigured(Boolean(body?.zoomOAuthConfigured));
        setZoomConnected(Boolean(body?.zoomConnected));
      }
    } finally {
      setLoadingZoom(false);
    }
  }

  useEffect(() => {
    loadZoomStatus();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const zoomResult = params.get("zoom");
    if (zoomResult !== "connected" && zoomResult !== "error") return;
    void loadZoomStatus();
    const url = new URL(window.location.href);
    url.searchParams.delete("zoom");
    const qs = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}`);
    if (zoomResult === "error") {
      window.alert(
        "Zoom did not finish connecting. If you use localhost: OAuth cookies need to work on http (try again after a dev-server restart). Also confirm Zoom redirect URL, scopes, and that the ZOOM database migration ran.",
      );
    }
  }, []);

  async function loadCashfreeStatus() {
    setLoadingCashfree(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) return;
      const res = await fetch("/api/integrations/cashfree/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setCashfreeConfigured(Boolean(body?.cashfreeConfigured));
        setConnected((prev) => ({ ...prev, cashfree: Boolean(body?.cashfreeConnected) }));
      }
    } finally {
      setLoadingCashfree(false);
    }
  }

  useEffect(() => {
    loadCashfreeStatus();
  }, []);

  useEffect(() => {
    setConnected((prev) => ({ ...prev, "google-meet": googleConnected }));
  }, [googleConnected]);

  useEffect(() => {
    setConnected((prev) => ({ ...prev, zoom: zoomConnected }));
  }, [zoomConnected]);

  function toggleIntegration(key: IntegrationKey) {
    setConnected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function toggleGoogleIntegration() {
    const client = await getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (googleConnected) {
      await fetch("/api/integrations/google/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      setGoogleConnected(false);
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
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (zoomConnected) {
      await fetch("/api/integrations/zoom/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      setZoomConnected(false);
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
    if (!client) return;
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return;

    if (connected.cashfree) {
      await fetch("/api/integrations/cashfree/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      setConnected((prev) => ({ ...prev, cashfree: false }));
      return;
    }
    const res = await fetch("/api/integrations/cashfree/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (res.ok) {
      setConnected((prev) => ({ ...prev, cashfree: true }));
      return;
    }
    const body = await res.json().catch(() => null);
    window.alert(body?.error || "Could not connect Cashfree.");
  }

  const connectedCount = useMemo(() => Object.values(connected).filter(Boolean).length, [connected]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Connect your core tools to make scheduling seamless across email and video meetings.
        </p>
        <p className="mt-3 text-xs font-medium text-zinc-500">
          {connectedCount} of {INTEGRATIONS.length} connected
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((item) => {
          const isConnected = connected[item.key];

          return (
            <article key={item.key} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-200">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[22px] w-[22px]"
                      role="img"
                      aria-hidden
                    >
                      <path d={item.iconPath} fill={item.iconColor} />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-900">{item.name}</h2>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </div>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                    isConnected
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200",
                  ].join(" ")}
                >
                  {isConnected && <CheckCircleIcon className="h-3.5 w-3.5" />}
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </div>

              <p className="min-h-[48px] text-sm leading-relaxed text-zinc-600">{item.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    item.key === "google-meet"
                      ? toggleGoogleIntegration()
                      : item.key === "zoom"
                        ? toggleZoomIntegration()
                        : item.key === "cashfree"
                          ? toggleCashfreeIntegration()
                          : toggleIntegration(item.key)
                  }
                  disabled={
                    (item.key === "google-meet" && loadingGoogle) ||
                    (item.key === "zoom" && (loadingZoom || !zoomOAuthConfigured)) ||
                    (item.key === "cashfree" && (loadingCashfree || !cashfreeConfigured))
                  }
                  className={[
                    "rounded-md px-3 py-2 text-xs font-medium transition",
                    isConnected
                      ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                      : "bg-[var(--app-primary)] text-[var(--app-primary-foreground)] hover:bg-[var(--app-primary-hover)]",
                    (item.key === "google-meet" && loadingGoogle) ||
                    (item.key === "zoom" && (loadingZoom || !zoomOAuthConfigured)) ||
                    (item.key === "cashfree" && (loadingCashfree || !cashfreeConfigured))
                      ? "opacity-60"
                      : "",
                  ].join(" ")}
                >
                  {item.key === "google-meet" && loadingGoogle
                    ? "Checking..."
                    : item.key === "zoom" && loadingZoom
                      ? "Checking..."
                    : item.key === "cashfree" && loadingCashfree
                      ? "Checking..."
                      : item.key === "zoom" && !zoomOAuthConfigured
                        ? "Set env first"
                      : item.key === "cashfree" && !cashfreeConfigured
                        ? "Set env first"
                    : isConnected
                      ? "Disconnect"
                      : "Connect"}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Details
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

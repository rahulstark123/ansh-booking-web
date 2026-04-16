"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchBillingSummary } from "@/lib/billing-api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const AVAILABLE_PLANS = [
  {
    id: "FREE" as const,
    name: "Free Plan",
    priceLabel: "₹0/mo",
    blurb: "For individuals getting started.",
    features: ["Up to 20 bookings / month", "Single booking link", "Basic Email alerts"],
  },
  {
    id: "PRO" as const,
    name: "Pro Plan",
    priceLabel: "₹399/mo",
    blurb: "For growing businesses and professionals.",
    features: [
      "Unlimited bookings",
      "WhatsApp & SMS Integration",
      "Custom Domain Branding",
      "Advanced Revenue Analytics",
    ],
  },
] as const;

type RazorpayCheckoutResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  plan: "PRO";
  subscriptionId: string;
  transactionId: string;
  prefill: {
    name: string;
    email: string;
  };
  companyName: string;
  description: string;
};

async function ensureRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatAmount(amountPaisa: number, currency: string): string {
  const value = amountPaisa / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const [paying, setPaying] = useState(false);
  const billingQuery = useQuery({
    queryKey: ["billing", "summary", user?.id ?? "__"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("Supabase not configured");
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) throw new Error("Not signed in");
      return fetchBillingSummary(data.session.access_token);
    },
  });

  const data = billingQuery.data;

  async function handleGoPro() {
    if (paying) return;
    setPaying(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) {
        window.alert("Authentication is not configured.");
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const hasScript = await ensureRazorpayScript();
      if (!hasScript || !window.Razorpay) {
        window.alert("Could not load Razorpay checkout. Please try again.");
        return;
      }

      const orderRes = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!orderRes.ok) {
        const payload = (await orderRes.json().catch(() => null)) as { error?: string } | null;
        window.alert(payload?.error || "Could not create checkout order.");
        return;
      }
      const checkout = (await orderRes.json()) as RazorpayCheckoutResponse;

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.companyName,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        notes: {
          plan: checkout.plan,
          subscriptionId: checkout.subscriptionId,
          transactionId: checkout.transactionId,
        },
        theme: { color: "#2a38ff" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/billing/checkout/verify", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscriptionId: checkout.subscriptionId,
              transactionId: checkout.transactionId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (!verifyRes.ok) {
            const payload = (await verifyRes.json().catch(() => null)) as { error?: string } | null;
            window.alert(payload?.error || "Payment verification failed.");
            return;
          }
          window.location.href = "/dashboard/billing?billing=success";
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      });
      razorpay.open();
    } catch {
      window.alert("Unable to start checkout right now. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Billing</h1>
        <p className="mt-1 text-sm text-zinc-600">View your current plan, subscription cycle, and recent payments.</p>
      </div>

      {billingQuery.isLoading && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
          Loading billing details...
        </div>
      )}

      {billingQuery.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          Could not load billing details. Please refresh and try again.
        </div>
      )}

      {!billingQuery.isLoading && !billingQuery.isError && data && (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Available plans</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {AVAILABLE_PLANS.map((plan) => {
                const current = data.plan === plan.id;
                return (
                  <article
                    key={plan.id}
                    className={[
                      "rounded-xl border p-4",
                      current
                        ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)]/40"
                        : "border-zinc-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-zinc-900">{plan.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">{plan.blurb}</p>
                      </div>
                      {current && (
                        <span className="rounded-full bg-[var(--app-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--app-primary-foreground)]">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">{plan.priceLabel}</p>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="text-sm text-zinc-700">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.id === "PRO" && (
                      <button
                        type="button"
                        disabled={current || paying}
                        onClick={() => void handleGoPro()}
                        className="mt-4 w-full rounded-full bg-[#2a38ff] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {current ? "Current plan" : paying ? "Opening checkout..." : "Upgrade to Pro"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Current plan</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">{data.plan === "PRO" ? "Pro" : "Free"}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Subscription status</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {data.activeSubscription?.status ?? "Not active"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">Current cycle ends</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {formatDate(data.activeSubscription?.currentPeriodEnd)}
              </p>
            </div>
          </div>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-semibold text-zinc-900">Recent transactions</h2>
            </div>
            {data.transactions.length === 0 ? (
              <p className="px-1 py-3 text-sm text-zinc-500">No transactions yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {data.transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between gap-4 px-1 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {tx.description ?? "Subscription payment"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {tx.provider} • {tx.providerPaymentId ?? tx.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900">{formatAmount(tx.amount, tx.currency)}</p>
                      <p className="text-xs text-zinc-500">
                        {tx.status} • {formatDate(tx.paidAt ?? tx.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

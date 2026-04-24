"use client";

import { useState } from "react";
import { CheckCircleIcon, CreditCardIcon, CalendarDaysIcon, RocketLaunchIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { fetchBillingSummary } from "@/lib/billing-api";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const AVAILABLE_PLANS = [
  {
    id: "FREE" as const,
    name: "Free Plan",
    priceLabel: "₹0",
    period: "forever",
    blurb: "Ideal for individuals and side projects.",
    features: ["Up to 20 bookings / month", "Single booking link", "Basic Email alerts"],
    buttonLabel: "Current Plan",
    highlight: false,
  },
  {
    id: "PRO" as const,
    name: "Pro Plan",
    priceLabel: "₹399",
    period: "per month",
    blurb: "Advanced tools for growing professionals.",
    features: [
      "Unlimited bookings",
      "WhatsApp & SMS Integration",
      "Custom Domain Branding",
      "Advanced Revenue Analytics",
      "Priority Support",
    ],
    buttonLabel: "Upgrade to Pro",
    highlight: true,
  },
] as const;

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
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatAmount(amountPaisa: number, currency: string): string {
  const value = amountPaisa / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
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
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const hasScript = await ensureRazorpayScript();
      if (!hasScript || !window.Razorpay) {
        window.alert("Could not load checkout.");
        return;
      }

      const orderRes = await fetch("/api/billing/checkout/order", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      if (!orderRes.ok) return;
      const checkout = await orderRes.json();

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.companyName,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        theme: { color: "#2a38ff" },
        handler: async (response: any) => {
          await fetch("/api/billing/checkout/verify", {
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
          window.location.href = "/dashboard/billing?billing=success";
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      razorpay.open();
    } catch {
      window.alert("Checkout failed. Try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-10 py-4"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Billing</h1>
        <p className="mt-2 text-base text-zinc-500 max-w-2xl">
          Manage your subscription plans and view payment history. Upgrade to unlock powerful automation and branding features.
        </p>
      </div>

      {!data && billingQuery.isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-[400px] animate-pulse rounded-3xl bg-zinc-50 ring-1 ring-zinc-200" />
          ))}
        </div>
      ) : (
        <>
          {/* Plan Cards */}
          <section className="grid gap-6 md:grid-cols-2">
            {AVAILABLE_PLANS.map((plan, idx) => {
              const isCurrent = data?.plan === plan.id;
              return (
                <motion.article
                  key={plan.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={[
                    "relative flex flex-col rounded-3xl p-8 transition-all",
                    plan.highlight 
                      ? "bg-zinc-900 text-white shadow-2xl shadow-[var(--app-primary-soft)] ring-1 ring-zinc-800" 
                      : "bg-white text-zinc-900 border border-zinc-200 shadow-sm"
                  ].join(" ")}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 right-8 rounded-full bg-[var(--app-primary)] px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                      Recommended
                    </div>
                  )}

                  <div className="mb-8">
                    <h2 className="text-xl font-extrabold">{plan.name}</h2>
                    <p className={[
                      "mt-2 text-sm font-medium",
                      plan.highlight ? "text-zinc-400" : "text-zinc-500"
                    ].join(" ")}>
                      {plan.blurb}
                    </p>
                  </div>

                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">{plan.priceLabel}</span>
                    <span className={[
                      "text-xs font-bold uppercase tracking-widest",
                      plan.highlight ? "text-zinc-500" : "text-zinc-400"
                    ].join(" ")}>
                      / {plan.period}
                    </span>
                  </div>

                  <ul className="mb-10 space-y-4 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                        <CheckCircleIcon className={[
                          "h-5 w-5 shrink-0",
                          plan.highlight ? "text-[var(--app-primary)]" : "text-zinc-400"
                        ].join(" ")} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isCurrent || (plan.id === "PRO" && paying)}
                    onClick={() => plan.id === "PRO" && handleGoPro()}
                    className={[
                      "w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                      isCurrent
                        ? (plan.highlight ? "bg-zinc-800 text-zinc-400 cursor-not-allowed" : "bg-zinc-50 text-zinc-400 cursor-not-allowed")
                        : (plan.highlight ? "bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)] shadow-xl shadow-[var(--app-primary-soft)]" : "bg-zinc-900 text-white hover:bg-zinc-800 shadow-md")
                    ].join(" ")}
                  >
                    {isCurrent ? "Current Plan" : paying && plan.id === "PRO" ? "Opening..." : plan.buttonLabel}
                  </button>
                </motion.article>
              );
            })}
          </section>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Status", value: data?.activeSubscription?.status || "Free Account", icon: RocketLaunchIcon },
              { label: "Payment Method", value: "Razorpay Secure", icon: CreditCardIcon },
              { label: "Next Renewal", value: formatDate(data?.activeSubscription?.currentPeriodEnd), icon: CalendarDaysIcon },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-[var(--app-primary)] ring-1 ring-zinc-100">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none">{stat.label}</p>
                  <p className="mt-1.5 text-base font-extrabold text-zinc-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* History */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-50 p-6">
              <h2 className="text-lg font-extrabold text-zinc-900">Transaction History</h2>
              <button className="inline-flex items-center gap-2 text-xs font-bold text-[var(--app-primary)] hover:underline">
                <ArrowPathIcon className="h-4 w-4" />
                Download All
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {data?.transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No transactions found</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-black">Description</th>
                      <th className="px-6 py-4 font-black">Amount</th>
                      <th className="px-6 py-4 font-black">Status</th>
                      <th className="px-6 py-4 font-black">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {data?.transactions.map((tx) => (
                      <tr key={tx.id} className="group hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-extrabold text-zinc-900">{tx.description || "Subscription"}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-0.5">{tx.providerPaymentId}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-zinc-900 tabular-nums">
                          {formatAmount(tx.amount, tx.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={[
                            "inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                            tx.status === "SUCCESS" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : tx.status === "FAILED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-zinc-100 text-zinc-500"
                          ].join(" ")}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-zinc-500 tabular-nums">
                          {formatDate(tx.paidAt || tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}

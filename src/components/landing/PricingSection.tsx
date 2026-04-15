"use client";

import { useState } from "react";

import { Reveal } from "@/components/Reveal";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

const PRICING_PLANS = [
  {
    name: "Free Plan",
    blurb: "For individuals getting started.",
    price: "₹0",
    period: "/mo",
    features: ["Up to 20 bookings / month", "Single booking link", "Basic Email alerts"],
    checkVariant: "green" as const,
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro Plan",
    blurb: "For growing businesses and professionals.",
    price: "₹399",
    period: "/mo",
    features: [
      "Unlimited bookings",
      "WhatsApp & SMS Integration",
      "Custom Domain Branding",
      "Advanced Revenue Analytics",
    ],
    checkVariant: "purple" as const,
    cta: "Go Pro",
    featured: true,
    badge: "RECOMMENDED",
  },
] as const;

function PricingCheck({ variant }: { variant: "green" | "purple" }) {
  const stroke = variant === "green" ? "#16a34a" : "#2a38ff";
  return (
    <svg className="mt-0.5 h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

export function PricingSection() {
  const [paying, setPaying] = useState(false);

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
          window.location.href = "/dashboard/settings?billing=success";
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
    <section
      id="pricing"
      className="app-section app-section-grid-light bg-[#f3f4ff]"
      aria-labelledby="pricing-heading"
    >
      <div className="app-container">
        <Reveal className="text-center">
          <h2 id="pricing-heading" className="app-section-title app-section-title--light">
            Scalable Pricing
          </h2>
          <p className="app-section-lead app-section-lead--light app-section-lead--center">
            Choose the plan that matches your current scale.
          </p>
        </Reveal>

        <div className="app-section-body grid gap-8 lg:grid-cols-2 lg:gap-10">
          {PRICING_PLANS.map((plan, i) => (
            <Reveal key={plan.name} delayMs={i * 80}>
              <article
                className={[
                  "app-hover-lift relative flex h-full flex-col rounded-[2rem] bg-white p-8 sm:p-10",
                  plan.featured
                    ? "shadow-[0_20px_50px_rgba(7,24,79,0.12)] ring-1 ring-[#e5e7eb]"
                    : "shadow-[0_8px_30px_rgba(7,24,79,0.06)]",
                ].join(" ")}
              >
                {plan.featured && plan.badge && (
                  <span className="absolute top-6 right-6 rounded-full bg-[#92400e] px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
                    {plan.badge}
                  </span>
                )}
                <h3 className="app-card-title">{plan.name}</h3>
                <p className="app-body app-body--light mt-2 text-base text-[#6b7280] sm:text-lg">{plan.blurb}</p>
                <p className="mt-8 flex items-baseline gap-0.5">
                  <span className="text-4xl font-extrabold tracking-tight text-[#0a1628] sm:text-5xl">{plan.price}</span>
                  <span className="text-lg font-semibold text-[#6b7280] sm:text-xl">{plan.period}</span>
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {plan.features.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-left">
                      <PricingCheck variant={plan.checkVariant} />
                      <span className="app-body pt-0.5 text-[#374151]">{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={plan.featured && paying}
                  onClick={plan.featured ? () => void handleGoPro() : undefined}
                  className={[
                    "mt-12 w-full rounded-full py-4 text-lg font-semibold transition-all duration-200 hover:opacity-95 active:scale-[0.99]",
                    plan.featured
                      ? "bg-[#2a38ff] text-white shadow-[0_8px_24px_rgba(42,56,255,0.35)] hover:shadow-[0_12px_28px_rgba(42,56,255,0.42)] disabled:cursor-not-allowed disabled:opacity-70"
                      : "bg-[#e8eeff] text-[#2a38ff] hover:bg-[#dce4ff]",
                  ].join(" ")}
                >
                  {plan.featured && paying ? "Opening checkout..." : plan.cta}
                </button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

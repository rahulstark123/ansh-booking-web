"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { SiteHeader } from "@/components/SiteHeader";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/contact-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, subject, message }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setNotice({ kind: "error", text: payload?.error || "Could not submit your request." });
        return;
      }
      setNotice({ kind: "success", text: "Thanks! We received your message and will contact you soon." });
      setFullName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch {
      setNotice({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9ff] pt-[calc(7.25rem+env(safe-area-inset-top,0px))] pb-10 text-[#0c1733] sm:pt-[calc(7.75rem+env(safe-area-inset-top,0px))] md:pt-[calc(9.75rem+env(safe-area-inset-top,0px))]">
      <SiteHeader />
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#081430] sm:text-3xl">Contact Us</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Need help with bookings, billing, or integrations? Send us a message and our team will get back.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-800">Full name *</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-800">Email *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-800">Phone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-800">Subject</span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Billing, account, integrations..."
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-zinc-800">Message *</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Tell us how we can help..."
                className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
              />
            </label>

            {notice && (
              <p
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  notice.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                ].join(" ")}
              >
                {notice.text}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="text-sm font-medium text-[#2a38ff] hover:underline">
                Back to home
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#2a38ff] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Send message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

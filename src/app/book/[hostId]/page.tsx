"use client";

import { ArrowLeftIcon, ClockIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";

import { BookingCalendarSelectByTemplate } from "@/components/booking/templates/BookingCalendarSelectByTemplate";
import { getTemplateShell } from "@/lib/booking-page-templates";
import { ensureRazorpayCheckoutScript } from "@/lib/razorpay-load-script";
import { motion, AnimatePresence } from "framer-motion";

type BookingEventKind = "ONE_ON_ONE" | "GROUP" | "ROUND_ROBIN";

type PublicEventPayment =
  | { enabled: false }
  | {
      enabled: true;
      provider: "razorpay";
      amountPaisa: number;
      amountLabel: string;
      label: string;
      /** False until the host saves Razorpay API keys under Integrations. */
      hostRazorpayReady: boolean;
    };

type PublicBookingPayload = {
  host: { 
    id: string; 
    name: string; 
    plan: "FREE" | "PRO";
    platformBranding: boolean;
    workspaceLogo: string | null;
  };
  event: {
    id: string;
    title: string;
    durationMinutes: number;
    kind: BookingEventKind;
    bookingPageTheme?: string;
    payment: PublicEventPayment;
  };
  availability: Array<{ dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }>;
  bookedIntervals: Array<{ startsAt: string; endsAt: string }>;
  timezone: string;
};

type TimeSlot = {
  iso: string;
  label: string;
};

type RazorpayBookingOrderResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  companyName: string;
  prefill?: { email?: string; name?: string };
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDayOfWeek(date: Date): number {
  const js = date.getDay(); // Sun=0 ... Sat=6
  return js === 0 ? 7 : js;
}

function parseHourMinute(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 0, minute: Number.isFinite(m) ? m : 0 };
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

function monthTitle(monthDate: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate);
}

function monthGrid(monthDate: Date): Date[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMinutesLocal(d: Date, minutes: number): Date {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + minutes);
  return x;
}

function slotOverlapsIntervals(
  slotStart: Date,
  durationMinutes: number,
  intervals: Array<{ startsAt: string; endsAt: string }>,
): boolean {
  const slotEnd = addMinutesLocal(slotStart, durationMinutes);
  for (const iv of intervals) {
    const bStart = new Date(iv.startsAt);
    const bEnd = new Date(iv.endsAt);
    if (slotStart < bEnd && slotEnd > bStart) return true;
  }
  return false;
}

export default function PublicBookingPage() {
  const params = useParams<{ hostId: string }>();
  const searchParams = useSearchParams();
  const hostId = typeof params.hostId === "string" ? params.hostId : "";
  const eventQuery = searchParams.get("event") || undefined;
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeIso, setSelectedTimeIso] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "details" | "confirmed">("select");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestCountryCode: "+91",
    guestPhone: "",
    guests: [] as string[],
    guestInput: "",
    notes: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedMeetingLink, setConfirmedMeetingLink] = useState<string | null>(null);

  const [data, setData] = useState<PublicBookingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    if (!hostId) {
      setLoading(false);
      setError("Invalid booking link.");
      return;
    }
    const eventPart = eventQuery ? `?event=${encodeURIComponent(eventQuery)}` : "";

    fetch(`/api/booking/public/${encodeURIComponent(hostId)}${eventPart}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error || "Could not load booking details.");
        }
        if (!mounted) return;
        const payload = body as PublicBookingPayload;
        setData({
          ...payload,
          bookedIntervals: payload.bookedIntervals ?? [],
          event: {
            ...payload.event,
            payment:
              payload.event.payment?.enabled === true
                ? {
                    ...payload.event.payment,
                    hostRazorpayReady: Boolean(
                      (payload.event.payment as { hostRazorpayReady?: boolean }).hostRazorpayReady,
                    ),
                  }
                : (payload.event.payment ?? { enabled: false }),
          },
        });
        setTimezone(payload.timezone || "Asia/Kolkata");
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hostId, eventQuery]);

  const availabilityByDay = useMemo(() => {
    const map = new Map<number, { enabled: boolean; startTime: string; endTime: string }>();
    for (const row of data?.availability ?? []) {
      map.set(row.dayOfWeek, row);
    }
    return map;
  }, [data]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const calendarDays = useMemo(() => monthGrid(currentMonth), [currentMonth]);

  const isDateBookable = (date: Date): boolean => {
    if (date < today) return false;
    const row = availabilityByDay.get(toDayOfWeek(date));
    return Boolean(row?.enabled);
  };

  const availableTimes = useMemo<TimeSlot[]>(() => {
    if (!selectedDate || !data) return [];
    const row = availabilityByDay.get(toDayOfWeek(selectedDate));
    if (!row?.enabled) return [];

    const start = parseHourMinute(row.startTime);
    const end = parseHourMinute(row.endTime);
    const slots: TimeSlot[] = [];
    const date = new Date(selectedDate);

    const step = Math.max(15, data.event.durationMinutes);
    const cursor = new Date(date);
    cursor.setHours(start.hour, start.minute, 0, 0);
    const endAt = new Date(date);
    endAt.setHours(end.hour, end.minute, 0, 0);

    while (cursor < endAt) {
      if (
        !slotOverlapsIntervals(cursor, data.event.durationMinutes, data.bookedIntervals ?? [])
      ) {
        slots.push({
          iso: cursor.toISOString(),
          label: formatTime(cursor, timezone),
        });
      }
      cursor.setMinutes(cursor.getMinutes() + step);
    }
    return slots;
  }, [selectedDate, data, availabilityByDay, timezone]);

  const selectedSlot = useMemo(
    () => availableTimes.find((slot) => slot.iso === selectedTimeIso) ?? null,
    [availableTimes, selectedTimeIso],
  );

  const selectedSlotDateLabel = useMemo(() => {
    if (!selectedSlot) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(selectedSlot.iso));
  }, [selectedSlot]);

  async function handleSchedule() {
    if (!data || !selectedSlot) return;
    if (!form.guestName.trim() || !form.guestEmail.trim() || !form.guestPhone.trim()) {
      setSubmitError("Name, email, and phone are required.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const pay = data.event.payment;
      const needsRazorpay = pay.enabled === true && pay.provider === "razorpay";
      if (needsRazorpay && !pay.hostRazorpayReady) {
        throw new Error(
          "This host has not finished connecting Razorpay yet. Please try again later or contact the host.",
        );
      }

      let razorpayExtra: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
      } | null = null;

      if (needsRazorpay) {
        const orderRes = await fetch(
          `/api/booking/public/${encodeURIComponent(data.host.id)}/razorpay-order`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId: data.event.id,
              startsAt: selectedSlot.iso,
              guestEmail: form.guestEmail.trim(),
              guestName: form.guestName.trim(),
            }),
          },
        );
        const orderJson = (await orderRes.json().catch(() => null)) as { error?: string } | null;
        if (!orderRes.ok) {
          throw new Error(orderJson?.error || "Could not start payment.");
        }
        const checkout = orderJson as RazorpayBookingOrderResponse;

        const scriptOk = await ensureRazorpayCheckoutScript();
        const RazorpayCtor = window.Razorpay;
        if (!scriptOk || !RazorpayCtor) {
          throw new Error("Could not load Razorpay checkout. Please try again.");
        }

        type RazorpayBookingPayment = {
          razorpayOrderId: string;
          razorpayPaymentId: string;
          razorpaySignature: string;
        } | null;

        razorpayExtra = await new Promise<RazorpayBookingPayment>((resolve, reject) => {
          const instance = new RazorpayCtor({
            key: checkout.keyId,
            amount: checkout.amount,
            currency: checkout.currency,
            name: checkout.companyName,
            description: checkout.description,
            order_id: checkout.orderId,
            prefill: {
              email: checkout.prefill?.email || form.guestEmail.trim(),
              name: checkout.prefill?.name || form.guestName.trim(),
            },
            theme: { color: "#2a38ff" },
            handler: (response) => {
              resolve({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: () => {
                resolve(null);
              },
            },
          });
          instance.on?.("payment.failed", () => {
            reject(new Error("Payment was not successful. Try again or use another method."));
          });
          instance.open();
        });

        if (!razorpayExtra) {
          return;
        }
      }

      const res = await fetch(`/api/booking/public/${encodeURIComponent(data.host.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: data.event.id,
          startsAt: selectedSlot.iso,
          guestName: form.guestName.trim(),
          guestEmail: form.guestEmail.trim(),
          guestCountryCode: form.guestCountryCode,
          guestPhone: form.guestPhone.trim(),
          guests: form.guests,
          notes: form.notes.trim() || undefined,
          ...(razorpayExtra ?? {}),
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          res.status === 402 && payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error?: string }).error)
            : (payload as { error?: string } | null)?.error || "Could not schedule this event.";
        throw new Error(msg);
      }
      setConfirmedMeetingLink(
        payload && typeof payload.meetingLink === "string" ? payload.meetingLink : null,
      );
      setStep("confirmed");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not schedule this event.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-zinc-600">Loading booking page…</div>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-rose-600">{error || "Failed to open booking page."}</p>
      </div>
    );
  }

  const shell = getTemplateShell(data.event.bookingPageTheme);

  return (
    <div className={`flex min-h-screen w-full items-center justify-center px-4 py-6 ${shell.pageWrap}`}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto grid w-full overflow-hidden rounded-2xl border ${shell.pageInner} ${shell.cardLayout} ${shell.card}`}
      >
        <aside className={shell.aside}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {data.host.workspaceLogo && (
                <div className="mb-6">
                  <img 
                    src={data.host.workspaceLogo} 
                    alt="Workspace Logo" 
                    className="h-12 w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
              {step !== "select" && (
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  className={`mb-5 inline-flex items-center rounded-full border p-2 transition ${shell.backBtn}`}
                  aria-label="Back to date and time"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
              )}
              <p className={`text-lg font-semibold ${shell.hostName}`}>{data.host.name}</p>
              <h1 className={`mt-1 font-bold tracking-tight ${shell.eventTitle}`}>{data.event.title}</h1>
              <p className={`mt-6 inline-flex items-center gap-2 text-lg font-medium ${shell.durationRow}`}>
                <ClockIcon className="h-5 w-5" />
                {data.event.durationMinutes} min
              </p>
              {selectedSlot && (
                <>
                  <p className={`mt-5 text-sm font-medium ${shell.slotWhen}`}>
                    {selectedSlot.label}, {selectedSlotDateLabel}
                  </p>
                  <p className={`mt-2 inline-flex items-center gap-2 text-sm ${shell.slotTz}`}>
                    <GlobeAltIcon className="h-4 w-4" />
                    {timezone === "Asia/Kolkata"
                      ? "India Standard Time"
                      : timezone === "Asia/Singapore"
                        ? "Singapore Time"
                        : "UTC"}
                  </p>
                  {confirmedMeetingLink && (
                    <a
                      href={confirmedMeetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${shell.joinLink}`}
                    >
                      <GlobeAltIcon className="h-4 w-4" />
                      Join meeting link
                    </a>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </aside>

        <section className={shell.section}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === "select" && (
                <BookingCalendarSelectByTemplate
                  templateId={data.event.bookingPageTheme}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  monthTitle={monthTitle}
                  calendarDays={calendarDays}
                  weekDays={WEEK_DAYS}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  selectedTimeIso={selectedTimeIso}
                  setSelectedTimeIso={setSelectedTimeIso}
                  availableTimes={availableTimes}
                  timezone={timezone}
                  setTimezone={setTimezone}
                  isDateBookable={isDateBookable}
                  sameDate={sameDate}
                  onContinueToDetails={() => setStep("details")}
                />
              )}

              {step === "details" && (
                <div className="max-w-xl">
                  <h2 className={`mb-2 text-5xl font-black tracking-tighter ${shell.h2}`}>Enter Details</h2>
                  <p className={`mb-8 text-sm font-medium ${shell.lead}`}>Complete this final step to schedule your elite booking.</p>

                  <div className="space-y-6">
                    <label className="block">
                      <span className={`mb-2 block text-[10px] font-black uppercase tracking-[0.2em] ${shell.label}`}>Name *</span>
                      <input
                        placeholder="Your full name"
                        value={form.guestName}
                        onChange={(e) => setForm((prev) => ({ ...prev, guestName: e.target.value }))}
                        className={`w-full rounded-xl border px-4 py-3.5 text-sm font-bold outline-none transition-all focus:ring-4 ${shell.input}`}
                      />
                    </label>

                    <label className="block">
                      <span className={`mb-2 block text-[10px] font-black uppercase tracking-[0.2em] ${shell.label}`}>Email *</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.guestEmail}
                        onChange={(e) => setForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                        className={`w-full rounded-xl border px-4 py-3.5 text-sm font-bold outline-none transition-all focus:ring-4 ${shell.input}`}
                      />
                    </label>

                    <label className="block">
                      <span className={`mb-2 block text-[10px] font-black uppercase tracking-[0.2em] ${shell.label}`}>Phone number *</span>
                      <div className="elite-phone-wrap">
                        <PhoneInput
                          country="in"
                          value={`${form.guestCountryCode.replace("+", "")}${form.guestPhone}`}
                          onChange={(value, country: { dialCode?: string }) => {
                            const dialCode = country?.dialCode ?? "";
                            const nextPhone =
                              dialCode && value.startsWith(dialCode) ? value.slice(dialCode.length) : value;
                            setForm((prev) => ({
                              ...prev,
                              guestCountryCode: dialCode ? `+${dialCode}` : prev.guestCountryCode,
                              guestPhone: nextPhone,
                            }));
                          }}
                          enableSearch
                          countryCodeEditable={false}
                          inputProps={{ name: "phone", required: true, placeholder: "Phone number" }}
                          containerClass="react-phone-input-container !border-none"
                          inputClass={`${shell.phoneInputClass} !rounded-xl !h-12 !font-bold !text-sm`}
                          buttonClass={`${shell.phoneButtonClass} !rounded-l-xl !border-r-0`}
                          dropdownClass="!text-sm !rounded-xl !shadow-2xl"
                        />
                      </div>
                    </label>

                    {data.event.kind === "GROUP" && (
                      <div className="space-y-4">
                        <label className="block">
                          <span className={`mb-2 block text-[10px] font-black uppercase tracking-[0.2em] ${shell.label}`}>Add guests (optional)</span>
                          <div className={`flex flex-wrap gap-2 rounded-xl border p-2 transition-all focus-within:ring-4 ${shell.input}`}>
                            {form.guests.map((email, idx) => (
                              <motion.span 
                                key={idx}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--app-primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--app-primary)] ring-1 ring-[var(--app-primary-soft-border)]"
                              >
                                {email}
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, guests: p.guests.filter((_, i) => i !== idx) }))}
                                  className="text-[var(--app-primary)]/50 hover:text-rose-500 transition-colors"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </motion.span>
                            ))}
                            <input
                              value={form.guestInput}
                              onChange={(e) => setForm((prev) => ({ ...prev, guestInput: e.target.value }))}
                              onBlur={() => {
                                const email = form.guestInput.trim().replace(/,$/, "");
                                if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !form.guests.includes(email)) {
                                  setForm(p => ({ ...p, guests: [...p.guests, email], guestInput: "" }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const email = form.guestInput.trim().replace(/,$/, "");
                                  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !form.guests.includes(email)) {
                                    setForm(p => ({ ...p, guests: [...p.guests, email], guestInput: "" }));
                                  }
                                }
                              }}
                              placeholder={form.guests.length === 0 ? "Email address..." : "Add another..."}
                              className="flex-1 min-w-[140px] bg-transparent text-sm font-bold outline-none placeholder:text-zinc-300"
                            />
                          </div>
                        </label>
                      </div>
                    )}

                    <label className="block">
                      <span className={`mb-2 block text-[10px] font-black uppercase tracking-[0.2em] ${shell.label}`}>
                        Notes for our meeting
                      </span>
                      <textarea
                        rows={4}
                        placeholder="What should we discuss?"
                        value={form.notes}
                        onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                        className={`w-full rounded-xl border px-4 py-3.5 text-sm font-bold outline-none transition-all focus:ring-4 ${shell.input}`}
                      />
                    </label>
                  </div>

                  {submitError && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 text-sm font-bold text-rose-500"
                    >
                      {submitError}
                    </motion.p>
                  )}

                  <div className="mt-8">
                    {data.event.payment.enabled && (
                      <div className="mb-6">
                        {!data.event.payment.hostRazorpayReady ? (
                          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-bold text-rose-900 shadow-sm backdrop-blur-sm">
                            A fee of <span className="text-sm font-black">{data.event.payment.amountLabel}</span> applies, 
                            but this host has not connected Razorpay yet.
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-xs font-bold text-amber-900 shadow-sm backdrop-blur-sm">
                            Secure Payment Required: <span className="text-sm font-black">{data.event.payment.amountLabel}</span>
                            <p className="mt-1 opacity-70 font-medium">Slot is reserved upon successful payment.</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={
                        submitting ||
                        (data.event.payment.enabled === true && !data.event.payment.hostRazorpayReady)
                      }
                      onClick={handleSchedule}
                      className={`w-full sm:w-auto rounded-2xl px-10 py-4 text-sm font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${shell.scheduleBtn}`}
                    >
                      {data.event.payment.enabled && !data.event.payment.hostRazorpayReady
                        ? "Payment unavailable"
                        : data.event.payment.enabled
                          ? submitting
                            ? "Processing…"
                            : `Pay ${data.event.payment.amountLabel} & schedule`
                          : submitting
                            ? "Scheduling..."
                            : "Schedule Event"}
                    </button>
                  </div>
                </div>
              )}

              {step === "confirmed" && (
                <div className="max-w-xl">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`rounded-[32px] border-2 p-8 md:p-12 text-center shadow-2xl ${shell.confirmedWrap}`}
                  >
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className={`text-4xl font-black tracking-tighter md:text-5xl ${shell.confirmedTitle}`}>
                      You're all set!
                    </h2>
                    <p className={`mt-6 text-lg font-medium leading-relaxed opacity-80 ${shell.confirmedText}`}>
                      Thanks, <span className="font-black text-slate-900">{form.guestName || "there"}</span>. 
                      Your appointment for <span className="font-black text-slate-900">{data.event.title}</span> is confirmed for 
                      <span className="block mt-1 font-black text-violet-600">
                        {selectedSlot?.label} on {selectedSlotDateLabel}.
                      </span>
                    </p>
                    <div className="mt-10 border-t border-slate-100 pt-8">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Next Steps</p>
                      <p className="mt-2 text-sm font-bold text-slate-500">A confirmation email has been sent to your inbox.</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </motion.div>

      {/* Branding Ribbon */}
      {(data.host.plan === "FREE" || data.host.platformBranding) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2"
        >
          <a 
            href="https://anshbookings.com" 
            target="_blank" 
            rel="noreferrer"
            className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 shadow-sm backdrop-blur-sm transition-all hover:border-[var(--app-primary-soft-border)] hover:bg-white hover:text-[var(--app-primary)] hover:shadow-md"
          >
            <span>Powered by</span>
            <span className="text-zinc-900 group-hover:text-[var(--app-primary)]">Ansh Bookings</span>
          </a>
        </motion.div>
      )}
    </div>
  );
}

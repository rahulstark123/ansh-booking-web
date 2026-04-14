"use client";

import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";

type BookingEventKind = "ONE_ON_ONE" | "GROUP" | "ROUND_ROBIN";

type PublicBookingPayload = {
  host: { id: string; name: string };
  event: { id: string; title: string; durationMinutes: number; kind: BookingEventKind };
  availability: Array<{ dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }>;
  bookedIntervals: Array<{ startsAt: string; endsAt: string }>;
  timezone: string;
};

type TimeSlot = {
  iso: string;
  label: string;
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
    guests: "",
    notes: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
          notes: form.notes.trim() || undefined,
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Could not schedule this event.");
      }
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:grid-cols-[340px_1fr]">
        <aside className="border-r border-zinc-200 p-8">
        {step !== "select" && (
          <button
            type="button"
            onClick={() => setStep("select")}
            className="mb-5 inline-flex items-center rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-50"
            aria-label="Back to date and time"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}
        <p className="text-lg font-semibold text-zinc-800">{data.host.name}</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-zinc-900">{data.event.title}</h1>
        <p className="mt-6 inline-flex items-center gap-2 text-lg font-medium text-zinc-700">
          <ClockIcon className="h-5 w-5" />
          {data.event.durationMinutes} min
        </p>
        {selectedSlot && (
          <>
            <p className="mt-5 text-sm font-medium text-zinc-700">
              {selectedSlot.label}, {selectedSlotDateLabel}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-600">
              <GlobeAltIcon className="h-4 w-4" />
              {timezone === "Asia/Kolkata"
                ? "India Standard Time"
                : timezone === "Asia/Singapore"
                  ? "Singapore Time"
                  : "UTC"}
            </p>
          </>
        )}
        </aside>

        <section className="p-8">
        {step === "select" && (
          <>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900">Select a Date &amp; Time</h2>
            <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100"
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <p className="text-2xl font-semibold text-zinc-900">{monthTitle(currentMonth)}</p>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100"
                    aria-label="Next month"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  {WEEK_DAYS.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {calendarDays.map((date) => {
                    const inMonth = date.getMonth() === currentMonth.getMonth();
                    const canBook = inMonth && isDateBookable(date);
                    const active = selectedDate ? sameDate(selectedDate, date) : false;
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => {
                          if (!canBook) return;
                          setSelectedDate(new Date(date));
                          setSelectedTimeIso(null);
                        }}
                        disabled={!canBook}
                        className={[
                          "h-12 rounded-full text-sm transition",
                          !inMonth ? "text-zinc-300" : "",
                          canBook ? "text-blue-700 hover:bg-blue-50" : "text-zinc-400",
                          active ? "bg-blue-100 font-semibold ring-2 ring-blue-300" : "",
                        ].join(" ")}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="mb-2 text-sm font-semibold text-zinc-700">Time zone</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700">
                    <GlobeAltIcon className="h-4 w-4" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="bg-transparent outline-none"
                    >
                      <option value="Asia/Kolkata">India Standard Time</option>
                      <option value="Asia/Singapore">Singapore Time</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-lg font-semibold text-zinc-800">
                  {selectedDate
                    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                        selectedDate,
                      )
                    : "Pick a date"}
                </p>
                <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                  {!selectedDate && <p className="text-sm text-zinc-500">Choose a date first.</p>}
                  {selectedDate && availableTimes.length === 0 && (
                    <p className="text-sm text-zinc-500">No slots available for this day.</p>
                  )}
                  {selectedDate &&
                    availableTimes.map((slot) => (
                      <div key={slot.iso} className="grid grid-cols-[1fr_auto] gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTimeIso(slot.iso)}
                          className={[
                            "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                            selectedTimeIso === slot.iso
                              ? "border-zinc-700 bg-zinc-700 text-white"
                              : "border-blue-300 text-blue-700 hover:bg-blue-50",
                          ].join(" ")}
                        >
                          {slot.label}
                        </button>
                        {selectedTimeIso === slot.iso && (
                          <button
                            type="button"
                            onClick={() => setStep("details")}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Next
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === "details" && (
          <div className="max-w-xl">
            <h2 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900">Enter Details</h2>
            <p className="mb-6 text-sm text-zinc-500">Complete this final step to schedule your event.</p>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-zinc-800">Name *</span>
              <input
                value={form.guestName}
                onChange={(e) => setForm((prev) => ({ ...prev, guestName: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-zinc-800">Email *</span>
              <input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-zinc-800">Phone number *</span>
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
                containerClass="react-phone-input-container"
                inputClass="!w-full !h-[42px] !rounded-lg !border-zinc-200 !bg-white !pl-14 !text-sm !text-zinc-900 focus:!border-blue-400 focus:!ring-2 focus:!ring-blue-100"
                buttonClass="!border-zinc-200 !bg-white hover:!bg-zinc-50"
                dropdownClass="!text-sm"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-zinc-800">Add guests (optional)</span>
              <input
                value={form.guests}
                onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
                placeholder="comma separated emails"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium text-zinc-800">
                Please share anything that will help prepare for our meeting
              </span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {submitError && <p className="mb-3 text-sm text-rose-600">{submitError}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={handleSchedule}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Scheduling..." : "Schedule Event"}
            </button>
          </div>
        )}

        {step === "confirmed" && (
          <div className="max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-2xl font-bold text-emerald-900">Your event is scheduled</h2>
            <p className="mt-2 text-sm text-emerald-800">
              Thanks {form.guestName || "there"}! We have booked your slot for {selectedSlot?.label} on{" "}
              {selectedSlotDateLabel}.
            </p>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}

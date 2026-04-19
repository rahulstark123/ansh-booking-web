"use client";

import { ArrowLeftIcon, ClockIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";

import { BookingCalendarSelectByTemplate } from "@/components/booking/templates/BookingCalendarSelectByTemplate";
import { getTemplateShell } from "@/lib/booking-page-templates";

type BookingEventKind = "ONE_ON_ONE" | "GROUP" | "ROUND_ROBIN";

type PublicBookingPayload = {
  host: { id: string; name: string };
  event: {
    id: string;
    title: string;
    durationMinutes: number;
    kind: BookingEventKind;
    bookingPageTheme?: string;
  };
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
      <div
        className={`mx-auto grid w-full overflow-hidden rounded-2xl border ${shell.pageInner} ${shell.cardLayout} ${shell.card}`}
      >
        <aside className={shell.aside}>
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
        </aside>

        <section className={shell.section}>
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
            <h2 className={`mb-2 text-4xl font-bold tracking-tight ${shell.h2}`}>Enter Details</h2>
            <p className={`mb-6 text-sm ${shell.lead}`}>Complete this final step to schedule your event.</p>

            <label className="mb-3 block">
              <span className={`mb-1 block text-sm font-medium ${shell.label}`}>Name *</span>
              <input
                value={form.guestName}
                onChange={(e) => setForm((prev) => ({ ...prev, guestName: e.target.value }))}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${shell.input}`}
              />
            </label>

            <label className="mb-3 block">
              <span className={`mb-1 block text-sm font-medium ${shell.label}`}>Email *</span>
              <input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, guestEmail: e.target.value }))}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${shell.input}`}
              />
            </label>

            <label className="mb-3 block">
              <span className={`mb-1 block text-sm font-medium ${shell.label}`}>Phone number *</span>
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
                inputClass={shell.phoneInputClass}
                buttonClass={shell.phoneButtonClass}
                dropdownClass="!text-sm"
              />
            </label>

            <label className="mb-3 block">
              <span className={`mb-1 block text-sm font-medium ${shell.label}`}>Add guests (optional)</span>
              <input
                value={form.guests}
                onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
                placeholder="comma separated emails"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${shell.input}`}
              />
            </label>

            <label className="mb-3 block">
              <span className={`mb-1 block text-sm font-medium ${shell.label}`}>
                Please share anything that will help prepare for our meeting
              </span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${shell.input}`}
              />
            </label>

            {submitError && <p className="mb-3 text-sm text-rose-600">{submitError}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={handleSchedule}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${shell.scheduleBtn}`}
            >
              {submitting ? "Scheduling..." : "Schedule Event"}
            </button>
          </div>
        )}

        {step === "confirmed" && (
          <div className={`max-w-xl rounded-xl border p-5 ${shell.confirmedWrap}`}>
            <h2 className={`text-2xl font-bold ${shell.confirmedTitle}`}>Your event is scheduled</h2>
            <p className={`mt-2 text-sm ${shell.confirmedText}`}>
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

"use client";

import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClockIcon,
  VideoCameraIcon,
  PlusIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

import { SCHEDULED_MEETINGS } from "@/lib/meetings-data";
import { SCHEDULING_EVENT_TYPES, type SchedulingEventTypeId } from "@/lib/scheduling-event-types";
import { useDashboardUiStore } from "@/stores/dashboard-ui-store";

type DaySchedule = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_WORKING_HOURS: DaySchedule[] = [
  { day: "Mon", enabled: true, start: "09:00", end: "18:00" },
  { day: "Tue", enabled: true, start: "09:00", end: "18:00" },
  { day: "Wed", enabled: true, start: "09:00", end: "18:00" },
  { day: "Thu", enabled: true, start: "09:00", end: "18:00" },
  { day: "Fri", enabled: true, start: "09:00", end: "17:00" },
  { day: "Sat", enabled: false, start: "09:00", end: "13:00" },
  { day: "Sun", enabled: false, start: "09:00", end: "13:00" },
];

export default function SchedulingPage() {
  const selected = useDashboardUiStore((s) => s.lastEventTypeChoice);
  const setSelected = useDashboardUiStore((s) => s.setLastEventTypeChoice);
  const [createOpen, setCreateOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    eventName: "",
    duration: "30",
    location: "google-meet",
    description: "",
    availability: "working-hours",
    minNotice: "4h",
    bufferBefore: "15",
    bufferAfter: "15",
    bookingWindow: "30d",
    bookingQuestion: "",
  });
  const [customHours, setCustomHours] = useState<DaySchedule[]>(
    DEFAULT_WORKING_HOURS.map((d) => ({ ...d })),
  );

  function chooseType(id: SchedulingEventTypeId) {
    setSelected(id);
    const type = SCHEDULING_EVENT_TYPES.find((x) => x.id === id);
    setForm((prev) => ({
      ...prev,
      eventName: type ? `${type.durationMinutes} min ${type.title}` : prev.eventName,
      duration: type ? String(type.durationMinutes) : prev.duration,
    }));
    setCreateOpen(false);
    setSetupOpen(true);
  }

  function EventTypeIcon({ id }: { id: SchedulingEventTypeId }) {
    if (id === "one-on-one") return <UserIcon className="h-4 w-4" aria-hidden />;
    if (id === "group") return <UserGroupIcon className="h-4 w-4" aria-hidden />;
    return <ArrowPathIcon className="h-4 w-4" aria-hidden />;
  }

  useEffect(() => {
    if (!createOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!createMenuRef.current) return;
      if (!createMenuRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [createOpen]);

  const selectedType = SCHEDULING_EVENT_TYPES.find((x) => x.id === selected) ?? null;

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Scheduling</h1>
            <p className="mt-1 text-sm text-zinc-600">
              All scheduled meetings appear here. Use Create to add a new event type.
            </p>
          </div>
          <div ref={createMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setCreateOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--app-primary)] px-4 py-2.5 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)]"
            >
              <PlusIcon className="h-4 w-4" aria-hidden />
              Create
            </button>

            {createOpen && (
              <div className="absolute top-[calc(100%+0.5rem)] right-0 z-40 w-[24rem] overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xl shadow-zinc-900/15">
                <div className="border-b border-zinc-100 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-zinc-900">Event type</h3>
                </div>

                <div className="divide-y divide-zinc-100 px-2 py-1">
                  {SCHEDULING_EVENT_TYPES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseType(item.id)}
                      className="w-full rounded-md px-2 py-2.5 text-left transition hover:bg-[var(--app-row-hover)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-md",
                            selected === item.id
                              ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]"
                              : "bg-zinc-100 text-zinc-500",
                          ].join(" ")}
                        >
                          <EventTypeIcon id={item.id} />
                        </span>
                        <p
                          className={[
                            "text-[1.05rem] leading-none font-semibold",
                            selected === item.id ? "text-[var(--app-primary)]" : "text-zinc-900",
                          ].join(" ")}
                        >
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-base text-zinc-800">
                        <span>{item.hostLabel}</span>
                        <span aria-hidden>&rarr;</span>
                        <span>{item.inviteeLabel}</span>
                      </p>
                      <p className="mt-0.5 text-base text-zinc-600">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 px-2 pb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Scheduled meetings</h2>
            <p className="text-xs text-zinc-500">{SCHEDULED_MEETINGS.length} total</p>
          </div>
          <ul className="divide-y divide-zinc-100">
            {SCHEDULED_MEETINGS.map((meeting) => (
              <li key={meeting.id} className="flex items-center justify-between gap-4 px-2 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{meeting.title}</p>
                  <p className="text-xs text-zinc-500">
                    {meeting.eventType} - {meeting.guest}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-1 text-xs text-zinc-500 sm:flex">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {meeting.time}
                  </div>
                  <span
                    className={[
                      "rounded-md px-2 py-1 text-xs font-medium",
                      meeting.status === "Upcoming"
                        ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                        : "bg-zinc-100 text-zinc-600",
                    ].join(" ")}
                  >
                    {meeting.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {setupOpen && selectedType && (
        <>
          <button
            type="button"
            onClick={() => setSetupOpen(false)}
            className="fixed inset-0 z-40 bg-zinc-900/25"
            aria-label="Close event setup"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{selectedType.title} event</p>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">Set up event type</h3>
              </div>
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close setup drawer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Event name" required>
                <Input
                  value={form.eventName}
                  onChange={(v) => setForm((s) => ({ ...s, eventName: v }))}
                  placeholder="30 min Discovery call"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration">
                  <Select
                    value={form.duration}
                    onChange={(v) => setForm((s) => ({ ...s, duration: v }))}
                    options={[
                      { value: "15", label: "15 minutes" },
                      { value: "30", label: "30 minutes" },
                      { value: "45", label: "45 minutes" },
                      { value: "60", label: "60 minutes" },
                    ]}
                  />
                </Field>
                <Field label="Location">
                  <Select
                    value={form.location}
                    onChange={(v) => setForm((s) => ({ ...s, location: v }))}
                    options={[
                      { value: "google-meet", label: "Google Meet" },
                      { value: "zoom", label: "Zoom" },
                      { value: "phone", label: "Phone call" },
                      { value: "in-person", label: "In person" },
                    ]}
                  />
                </Field>
              </div>

              <Field label="Description / instructions">
                <TextArea
                  value={form.description}
                  onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                  placeholder="Add context, agenda, or instructions for invitees."
                />
              </Field>

              <Field label="Availability schedule">
                <Select
                  value={form.availability}
                  onChange={(v) => setForm((s) => ({ ...s, availability: v }))}
                  options={[
                    { value: "working-hours", label: "Default working hours" },
                    { value: "weekday-mornings", label: "Weekday mornings" },
                    { value: "custom", label: "Custom schedule" },
                  ]}
                />
              </Field>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Time slots</p>
                  {form.availability !== "custom" && (
                    <span className="text-xs font-medium text-zinc-500">
                      Using saved default hours (read-only)
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {(form.availability === "custom" ? customHours : DEFAULT_WORKING_HOURS).map((row, idx) => (
                    <div key={row.day} className="grid grid-cols-[40px_1fr_14px_1fr] items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700">{row.day}</span>
                      <input
                        type="time"
                        value={row.start}
                        disabled={!row.enabled || form.availability !== "custom"}
                        onChange={(e) =>
                          setCustomHours((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, start: e.target.value } : d)),
                          )
                        }
                        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                      />
                      <span className="text-zinc-400">-</span>
                      <input
                        type="time"
                        value={row.end}
                        disabled={!row.enabled || form.availability !== "custom"}
                        onChange={(e) =>
                          setCustomHours((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, end: e.target.value } : d)),
                          )
                        }
                        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Min notice">
                  <Select
                    value={form.minNotice}
                    onChange={(v) => setForm((s) => ({ ...s, minNotice: v }))}
                    options={[
                      { value: "1h", label: "1 hour" },
                      { value: "4h", label: "4 hours" },
                      { value: "12h", label: "12 hours" },
                      { value: "24h", label: "24 hours" },
                    ]}
                  />
                </Field>
                <Field label="Buffer before">
                  <Select
                    value={form.bufferBefore}
                    onChange={(v) => setForm((s) => ({ ...s, bufferBefore: v }))}
                    options={[
                      { value: "0", label: "0 min" },
                      { value: "10", label: "10 min" },
                      { value: "15", label: "15 min" },
                      { value: "30", label: "30 min" },
                    ]}
                  />
                </Field>
                <Field label="Buffer after">
                  <Select
                    value={form.bufferAfter}
                    onChange={(v) => setForm((s) => ({ ...s, bufferAfter: v }))}
                    options={[
                      { value: "0", label: "0 min" },
                      { value: "10", label: "10 min" },
                      { value: "15", label: "15 min" },
                      { value: "30", label: "30 min" },
                    ]}
                  />
                </Field>
              </div>

              <Field label="Booking window">
                <Select
                  value={form.bookingWindow}
                  onChange={(v) => setForm((s) => ({ ...s, bookingWindow: v }))}
                  options={[
                    { value: "14d", label: "Next 14 days" },
                    { value: "30d", label: "Next 30 days" },
                    { value: "60d", label: "Next 60 days" },
                    { value: "90d", label: "Next 90 days" },
                  ]}
                />
              </Field>

              <Field label="Booking form question (optional)">
                <Input
                  value={form.bookingQuestion}
                  onChange={(v) => setForm((s) => ({ ...s, bookingQuestion: v }))}
                  placeholder="What should we focus on in this meeting?"
                />
              </Field>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
                <p className="text-sm font-medium text-zinc-900">{form.eventName || "Untitled event"}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {form.duration} minutes
                  <span aria-hidden>•</span>
                  <VideoCameraIcon className="h-3.5 w-3.5" />
                  {form.location === "google-meet"
                    ? "Google Meet"
                    : form.location === "zoom"
                      ? "Zoom"
                      : form.location === "phone"
                        ? "Phone call"
                        : "In person"}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 bg-white pt-4">
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)]"
              >
                Save event
              </button>
            </div>
          </aside>
        </>
      )}

    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pr-9 pl-3 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

"use client";

import {
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const WEEKLY_HOURS = [
  { day: "Monday", slots: ["09:00 - 12:30", "14:00 - 18:00"] },
  { day: "Tuesday", slots: ["09:00 - 12:30", "14:00 - 18:00"] },
  { day: "Wednesday", slots: ["09:00 - 12:30", "14:00 - 18:00"] },
  { day: "Thursday", slots: ["09:00 - 12:30", "14:00 - 18:00"] },
  { day: "Friday", slots: ["09:00 - 13:00"] },
  { day: "Saturday", slots: [] },
  { day: "Sunday", slots: [] },
];

const DATE_OVERRIDES = [
  { date: "Apr 15, 2026", label: "Company offsite", status: "Unavailable" },
  { date: "Apr 18, 2026", label: "Half day", status: "10:00 - 13:00" },
];

export default function AvailabilityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Availability</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Configure when people can book you: weekly hours, date overrides, timezone, notice, and buffers.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 px-2 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <ClockIcon className="h-4 w-4 text-zinc-400" />
              Weekly working hours
            </h2>
            <button
              type="button"
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Edit hours
            </button>
          </div>
          <ul className="divide-y divide-zinc-100">
            {WEEKLY_HOURS.map((row) => (
              <li key={row.day} className="flex items-center justify-between gap-4 px-2 py-2.5">
                <span className="text-sm font-medium text-zinc-800">{row.day}</span>
                <span className="text-sm text-zinc-500">{row.slots.length ? row.slots.join(", ") : "Unavailable"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-zinc-100 px-2 pb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <CalendarDaysIcon className="h-4 w-4 text-zinc-400" />
              Date overrides
            </h2>
            <button
              type="button"
              className="rounded-md bg-[var(--app-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)]"
            >
              Add override
            </button>
          </div>
          <ul className="space-y-2 px-2">
            {DATE_OVERRIDES.map((item) => (
              <li key={item.date} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-sm font-medium text-zinc-900">{item.date}</p>
                <p className="text-xs text-zinc-600">
                  {item.label} - {item.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

    </div>
  );
}

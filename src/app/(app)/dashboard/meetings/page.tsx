"use client";

import { CalendarDaysIcon, FunnelIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { SCHEDULED_MEETINGS } from "@/lib/meetings-data";

type MeetingFilter = "all" | "upcoming" | "completed";

export default function MeetingsPage() {
  const [filter, setFilter] = useState<MeetingFilter>("all");

  const meetings = useMemo(() => {
    if (filter === "all") return SCHEDULED_MEETINGS;
    if (filter === "upcoming") return SCHEDULED_MEETINGS.filter((m) => m.status === "Upcoming");
    return SCHEDULED_MEETINGS.filter((m) => m.status === "Completed");
  }, [filter]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Meetings</h1>
        <p className="mt-1 text-sm text-zinc-600">
          People who book from your Scheduling event types will appear here automatically.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-2 pb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <FunnelIcon className="h-4 w-4 text-zinc-400" />
            Filter
          </div>
          <div className="flex items-center gap-2">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterChip label="Upcoming" active={filter === "upcoming"} onClick={() => setFilter("upcoming")} />
            <FilterChip label="Completed" active={filter === "completed"} onClick={() => setFilter("completed")} />
          </div>
        </div>

        <ul className="divide-y divide-zinc-100">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="flex items-center justify-between gap-4 px-2 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{meeting.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <UserCircleIcon className="h-4 w-4 text-zinc-400" />
                  <span>{meeting.guest}</span>
                  <span aria-hidden>-</span>
                  <span>{meeting.eventType}</span>
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
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
        active
          ? "border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

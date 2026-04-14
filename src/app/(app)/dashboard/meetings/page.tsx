"use client";

import { CalendarDaysIcon, FunnelIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { useBookedMeetings } from "@/hooks/use-booked-meetings";
import { useAuthStore } from "@/stores/auth-store";

type MeetingFilter = "all" | "upcoming" | "completed";

export default function MeetingsPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<MeetingFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data, isLoading, isError } = useBookedMeetings(user?.id, { page, pageSize, filter });
  const meetings = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Meetings</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Guest bookings from your public scheduling links are listed here (same data as Booked meetings on
          Scheduling).
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-2 pb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <FunnelIcon className="h-4 w-4 text-zinc-400" />
            Filter
          </div>
          <div className="flex items-center gap-2">
            <FilterChip label="All" active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }} />
            <FilterChip label="Upcoming" active={filter === "upcoming"} onClick={() => { setFilter("upcoming"); setPage(1); }} />
            <FilterChip label="Completed" active={filter === "completed"} onClick={() => { setFilter("completed"); setPage(1); }} />
          </div>
        </div>

        {isError && (
          <p className="px-2 py-6 text-sm text-rose-600">Could not load meetings. Try refreshing.</p>
        )}
        {!isError && isLoading && (
          <p className="px-2 py-6 text-sm text-zinc-500">Loading meetings…</p>
        )}
        {!isError && !isLoading && meetings.length === 0 && (
          <p className="px-2 py-6 text-sm text-zinc-500">
            No bookings yet. Share your booking link from Scheduling so invitees can reserve a time.
          </p>
        )}
        {!isError && !isLoading && meetings.length > 0 && (
          <>
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
                  {meeting.meetingLink && (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex"
                    >
                      Open link
                    </a>
                  )}
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
            <div className="mt-3 flex items-center justify-between px-2">
              <p className="text-xs text-zinc-500">
                Page {page} of {totalPages} - {total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
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

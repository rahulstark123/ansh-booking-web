"use client";

import { 
  CalendarDaysIcon, 
  FunnelIcon, 
  UserCircleIcon,
  VideoCameraIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-8 py-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Meetings</h1>
          <p className="mt-2 text-base text-zinc-500 max-w-xl">
            View and manage all guest bookings from your public scheduling links. Track upcoming sessions and past history.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100/80 p-1.5 rounded-2xl ring-1 ring-zinc-200">
          {(["all", "upcoming", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={[
                "relative px-5 py-2 text-xs font-bold uppercase tracking-widest transition-colors z-10",
                filter === f ? "text-[var(--app-primary)]" : "text-zinc-500 hover:text-zinc-700"
              ].join(" ")}
            >
              {f}
              {filter === f && (
                <motion.div
                  layoutId="meetingFilter"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-6">
        {isError && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-12 text-center">
            <XMarkIcon className="w-12 h-12 text-rose-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-rose-900">Could not load meetings</p>
            <p className="text-sm text-rose-600 mt-1">Please check your connection and try again.</p>
          </div>
        )}

        {!isError && isLoading && (
          <div className="grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-3xl border border-zinc-100 bg-white p-6 animate-pulse" />
            ))}
          </div>
        )}

        {!isError && !isLoading && meetings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-zinc-100">
              <CalendarDaysIcon className="w-10 h-10 text-zinc-300" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">No bookings found</h3>
            <p className="mt-2 text-base text-zinc-500 max-w-sm mx-auto font-medium">
              Share your booking link from Scheduling to let invitees reserve a time on your calendar.
            </p>
          </div>
        )}

        {!isError && !isLoading && meetings.length > 0 && (
          <>
            <motion.div 
              layout
              className="grid gap-6 sm:grid-cols-2"
            >
              {meetings.map((meeting, idx) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-[var(--app-primary-soft-border)] hover:shadow-xl hover:shadow-[var(--app-ring)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-zinc-900 group-hover:text-[var(--app-primary)] transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                          <UserCircleIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                          <span className="truncate">{meeting.guest}</span>
                        </div>
                      </div>
                      
                      <span
                        className={[
                          "shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors",
                          meeting.status === "Upcoming"
                            ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                            : "bg-zinc-100 text-zinc-500",
                        ].join(" ")}
                      >
                        {meeting.status}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-zinc-100 shadow-sm">
                          <ClockIcon className="h-4 w-4" />
                        </div>
                        {meeting.time}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-zinc-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-50 ring-1 ring-zinc-100 shadow-sm">
                          <VideoCameraIcon className="h-4 w-4" />
                        </div>
                        {meeting.platform} · {meeting.eventType}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                    {meeting.meetingLink ? (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)] transition-colors group/link"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                        Join Meeting
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-zinc-300">Link Unavailable</span>
                    )}

                    <div className="text-[10px] font-bold text-zinc-400 tabular-nums">
                      ID: {meeting.id.slice(0, 8)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-between border-t border-zinc-100 pt-8 px-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Page <span className="text-zinc-900">{page}</span> / {totalPages}
                <span className="mx-3 text-zinc-200">|</span>
                <span className="text-zinc-900">{total}</span> total bookings
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </motion.div>
  );
}

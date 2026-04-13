"use client";

import {
  CalendarDaysIcon,
  ClockIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { useWeeklyAvailability } from "@/hooks/use-weekly-availability";
import {
  type WeeklyAvailabilityRow,
  updateWeeklyAvailability,
} from "@/lib/availability-api";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

const DATE_OVERRIDES = [
  { date: "Apr 15, 2026", label: "Company offsite", status: "Unavailable" },
  { date: "Apr 18, 2026", label: "Half day", status: "10:00 - 13:00" },
];

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: weeklyHours = [], isLoading, isError } = useWeeklyAvailability(user?.id);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<WeeklyAvailabilityRow[]>([]);

  useEffect(() => {
    if (!editOpen) return;
    setDraft(weeklyHours.map((h) => ({ ...h })));
  }, [editOpen, weeklyHours]);

  const rowsForView = useMemo(() => {
    if (isLoading) return [];
    return weeklyHours;
  }, [isLoading, weeklyHours]);

  async function saveWeeklyHours() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) {
        showToast({ kind: "error", title: "Configuration error", message: "Supabase is not configured." });
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) {
        showToast({ kind: "error", title: "Session expired", message: "Please sign in again." });
        return;
      }
      await updateWeeklyAvailability(data.session.access_token, draft);
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.weekly(user.id) });
      showToast({ kind: "success", title: "Availability updated", message: "Weekly hours saved." });
      setEditOpen(false);
    } catch {
      showToast({ kind: "error", title: "Save failed", message: "Could not update weekly hours." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
                onClick={() => setEditOpen(true)}
                className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                Edit hours
              </button>
            </div>
            {isError && (
              <p className="px-2 py-3 text-sm text-rose-600">Could not load availability.</p>
            )}
            {isLoading && (
              <p className="px-2 py-3 text-sm text-zinc-500">Loading weekly hours...</p>
            )}
            {!isLoading && !isError && (
              <ul className="divide-y divide-zinc-100">
                {rowsForView.map((row) => (
                  <li key={row.dayOfWeek} className="flex items-center justify-between gap-4 px-2 py-2.5">
                    <span className="text-sm font-medium text-zinc-800">{row.dayLabel}</span>
                    <span className="text-sm text-zinc-500">
                      {row.enabled ? `${row.startTime} - ${row.endTime}` : "Unavailable"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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

      {editOpen && (
        <>
          <button
            type="button"
            onClick={() => setEditOpen(false)}
            className="fixed inset-0 z-40 bg-zinc-900/25"
            aria-label="Close weekly hours editor"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Availability</p>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">Edit weekly hours</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close editor"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {draft.map((row, idx) => (
                <div key={row.dayOfWeek} className="rounded-lg border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-800">{row.dayLabel}</p>
                    <label className="inline-flex items-center gap-2 text-xs text-zinc-600">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, enabled: e.target.checked } : d)),
                          )
                        }
                      />
                      Enabled
                    </label>
                  </div>
                  <div className="grid grid-cols-[1fr_12px_1fr] items-center gap-2">
                    <input
                      type="time"
                      value={row.startTime}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, startTime: e.target.value } : d)),
                        )
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                    />
                    <span className="text-zinc-400">-</span>
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((d, i) => (i === idx ? { ...d, endTime: e.target.value } : d)),
                        )
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 bg-white pt-4">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveWeeklyHours}
                className="rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save hours"}
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

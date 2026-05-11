"use client";

import {
  CalendarDaysIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  NoSymbolIcon
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { DrawerBackdrop } from "@/components/ui/drawer-backdrop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { useAvailabilityOverrides } from "@/hooks/use-availability-overrides";
import { useWeeklyAvailability } from "@/hooks/use-weekly-availability";
import {
  createAvailabilityOverride,
  deleteAvailabilityOverride,
  type WeeklyAvailabilityRow,
  updateWeeklyAvailability,
} from "@/lib/availability-api";
import { queryKeys } from "@/lib/query-keys";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: weeklyHours = [], isLoading, isError } = useWeeklyAvailability(user?.id);
  const { data: overrides = [], isLoading: overridesLoading } = useAvailabilityOverrides(user?.id);
  const [editOpen, setEditOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideDeletingId, setOverrideDeletingId] = useState<string | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draft, setDraft] = useState<WeeklyAvailabilityRow[]>([]);
  const [overrideDraft, setOverrideDraft] = useState({
    date: "",
    startTime: "14:00",
    endTime: "16:00",
    isAllDay: false,
    label: "",
  });

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

  async function addOverride() {
    if (!user?.id) return;
    setOverrideSaving(true);
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
      if (!overrideDraft.date) {
        showToast({ kind: "error", title: "Date required", message: "Choose a date for the override." });
        return;
      }
      await createAvailabilityOverride(data.session.access_token, {
        date: overrideDraft.date,
        startTime: overrideDraft.isAllDay ? null : overrideDraft.startTime,
        endTime: overrideDraft.isAllDay ? null : overrideDraft.endTime,
        isAllDay: overrideDraft.isAllDay,
        label: overrideDraft.label.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.overrides(user.id) });
      showToast({ kind: "success", title: "Override added", message: "This time will be blocked from bookings." });
      setOverrideOpen(false);
      setOverrideDraft({ date: "", startTime: "14:00", endTime: "16:00", isAllDay: false, label: "" });
    } catch {
      showToast({ kind: "error", title: "Save failed", message: "Could not create override." });
    } finally {
      setOverrideSaving(false);
    }
  }

  async function performDelete() {
    if (!user?.id || !idToDelete) return;
    const id = idToDelete;
    setIdToDelete(null);
    setShowDeleteConfirm(false);
    setOverrideDeletingId(id);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) return;
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token) return;
      await deleteAvailabilityOverride(data.session.access_token, id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.availability.overrides(user.id) });
      showToast({ kind: "success", title: "Override removed", message: "Date override deleted." });
    } catch {
      showToast({ kind: "error", title: "Delete failed", message: "Could not delete override." });
    } finally {
      setOverrideDeletingId(null);
    }
  }

  function removeOverride(id: string) {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-8 py-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Availability</h1>
          <p className="mt-2 text-base text-zinc-500 max-w-2xl">
            Fine-tune your scheduling rules. Define standard weekly hours and manage specific date overrides for holidays or busy periods.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Weekly Hours */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Weekly working hours</h2>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Configure
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm overflow-hidden">
            {isError && (
              <p className="p-8 text-center text-sm font-bold text-rose-600">Could not load availability.</p>
            )}
            {isLoading && (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-zinc-50" />
                ))}
              </div>
            )}
            {!isLoading && !isError && (
              <ul className="divide-y divide-zinc-100">
                {weeklyHours.map((row, idx) => (
                  <motion.li 
                    key={row.dayOfWeek}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-zinc-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={[
                        "flex h-10 w-10 items-center justify-center rounded-2xl ring-1 transition-all group-hover:scale-110",
                        row.enabled ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)] ring-[var(--app-primary-soft-border)] shadow-sm" : "bg-zinc-50 text-zinc-300 ring-zinc-100"
                      ].join(" ")}>
                        {row.enabled ? <CheckCircleIcon className="h-5 w-5" /> : <NoSymbolIcon className="h-5 w-5" />}
                      </div>
                      <span className="text-sm font-bold text-zinc-900">{row.dayLabel}</span>
                    </div>
                    <div className="text-right">
                      <span className={[
                        "text-sm font-bold tabular-nums transition-colors",
                        row.enabled ? "text-zinc-700" : "text-zinc-400 font-medium italic"
                      ].join(" ")}>
                        {row.enabled ? `${row.startTime} - ${row.endTime}` : "Unavailable"}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Date Overrides */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Date overrides</h2>
            <button
              type="button"
              onClick={() => setOverrideOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-4 py-2 text-xs font-bold text-[var(--app-primary-foreground)] shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusIcon className="h-4 w-4" />
              Add Block
            </button>
          </div>

          <div className="space-y-3">
            {overridesLoading && <p className="p-8 text-center text-sm font-bold text-zinc-400">Syncing overrides...</p>}
            {!overridesLoading && overrides.length === 0 && (
              <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center">
                <CalendarDaysIcon className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-zinc-500">No active overrides</p>
                <p className="mt-1 text-xs text-zinc-400 max-w-[180px] mx-auto leading-relaxed">
                  Date-specific blocks will appear here when you add them.
                </p>
              </div>
            )}
            {overrides.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--app-primary-soft-border)] hover:shadow-xl hover:shadow-[var(--app-ring)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-zinc-900 group-hover:text-[var(--app-primary)] transition-colors">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-tight">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {item.isAllDay ? "All Day Unavailable" : `${item.startTime} - ${item.endTime}`}
                    </p>
                    {item.label && (
                      <div className="mt-3 inline-flex rounded-lg bg-zinc-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-400 ring-1 ring-zinc-100">
                        {item.label}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOverride(item.id)}
                    disabled={overrideDeletingId === item.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-white text-zinc-400 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    title="Remove override"
                  >
                    {overrideDeletingId === item.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Weekly Hours Editor Drawer */}
      <AnimatePresence>
        {editOpen && (
          <>
            <DrawerBackdrop onClick={() => setEditOpen(false)} />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-8 shadow-2xl"
            >
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--app-primary)]">Settings</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">Standard Hours</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-3">
                {draft.map((row, idx) => (
                  <div key={row.dayOfWeek} className={[
                    "rounded-2xl border p-4 transition-all",
                    row.enabled ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-100 bg-zinc-50 opacity-75"
                  ].join(" ")}>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-zinc-900">{row.dayLabel}</p>
                      
                      {/* Premium Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => 
                          setDraft((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d)),
                          )
                        }
                        className={[
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          row.enabled ? "bg-[var(--app-primary)]" : "bg-zinc-300"
                        ].join(" ")}
                      >
                        <span className={[
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          row.enabled ? "translate-x-5" : "translate-x-0"
                        ].join(" ")} />
                      </button>
                    </div>

                    <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
                      <input
                        type="time"
                        value={row.startTime}
                        disabled={!row.enabled}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, startTime: e.target.value } : d)),
                          )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold tabular-nums text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)] disabled:opacity-30"
                      />
                      <span className="text-center font-bold text-zinc-300">-</span>
                      <input
                        type="time"
                        value={row.endTime}
                        disabled={!row.enabled}
                        onChange={(e) =>
                          setDraft((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, endTime: e.target.value } : d)),
                          )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold tabular-nums text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)] disabled:opacity-30"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 bg-white/80 pt-6 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveWeeklyHours}
                  className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-[var(--app-primary-foreground)] shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                >
                  {saving ? "Syncing..." : "Apply Schedule"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Override Editor Drawer */}
      <AnimatePresence>
        {overrideOpen && (
          <>
            <DrawerBackdrop onClick={() => setOverrideOpen(false)} />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-8 shadow-2xl"
            >
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--app-primary)]">One-time Block</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">Add Override</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOverrideOpen(false)}
                  className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Pick Date</label>
                  <input
                    type="date"
                    value={overrideDraft.date}
                    onChange={(e) => setOverrideDraft((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <span className="text-sm font-bold text-zinc-700">Unavailable all day</span>
                  <button
                    type="button"
                    onClick={() => setOverrideDraft((p) => ({ ...p, isAllDay: !p.isAllDay }))}
                    className={[
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      overrideDraft.isAllDay ? "bg-[var(--app-primary)]" : "bg-zinc-300"
                    ].join(" ")}
                  >
                    <span className={[
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      overrideDraft.isAllDay ? "translate-x-5" : "translate-x-0"
                    ].join(" ")} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Time Range</label>
                  <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
                    <input
                      type="time"
                      value={overrideDraft.startTime}
                      disabled={overrideDraft.isAllDay}
                      onChange={(e) => setOverrideDraft((p) => ({ ...p, startTime: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold tabular-nums text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)] disabled:opacity-30"
                    />
                    <span className="text-center font-bold text-zinc-300">-</span>
                    <input
                      type="time"
                      value={overrideDraft.endTime}
                      disabled={overrideDraft.isAllDay}
                      onChange={(e) => setOverrideDraft((p) => ({ ...p, endTime: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold tabular-nums text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)] disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Label (Reason)</label>
                  <input
                    type="text"
                    value={overrideDraft.label}
                    onChange={(e) => setOverrideDraft((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Holiday, Dr. Appointment, etc."
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-900 transition-all focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 mt-12 flex items-center justify-end gap-3 border-t border-zinc-100 bg-white/80 pt-6 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setOverrideOpen(false)}
                  className="rounded-2xl border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={overrideSaving}
                  onClick={addOverride}
                  className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-[var(--app-primary-foreground)] shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                >
                  {overrideSaving ? "Adding..." : "Add Override"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Remove Override?"
        message="This will restore your default availability for this date. Guests will be able to book based on your standard weekly hours."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={performDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setIdToDelete(null);
        }}
      />
    </motion.div>
  );
}

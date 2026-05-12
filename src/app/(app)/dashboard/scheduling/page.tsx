"use client";

import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  VideoCameraIcon,
  PlusIcon,
  PowerIcon,
  TrashIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { BookingPageThemePreview } from "@/components/booking/BookingPageThemePreview";
import { ChooseEventTypeMenu } from "@/components/dashboard/ChooseEventTypeMenu";
import { DrawerBackdrop } from "@/components/ui/drawer-backdrop";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { useScheduledMeetings } from "@/hooks/use-scheduled-meetings";
import type { ScheduledMeeting } from "@/lib/meetings-data";
import type { BookingEventTypeDetail } from "@/lib/booking-event-types-api";
import {
  createBookingEventType,
  fetchBookingEventType,
  updateBookingEventType,
} from "@/lib/booking-event-types-api";
import {
  BOOKING_PAGE_THEME_OPTIONS,
  normalizeBookingPageTheme,
  type BookingPageThemeId,
} from "@/lib/booking-page-templates";
import { bookingLocationLabel } from "@/lib/booking-location-label";
import type { MeetingPaymentProviderId } from "@/lib/meeting-payment-providers";
import { MEETING_PAYMENT_PROVIDER_CHIPS } from "@/lib/meeting-payment-providers";
import { deleteScheduledEvent } from "@/lib/meetings-api";
import { queryKeys } from "@/lib/query-keys";
import { SCHEDULING_EVENT_TYPES, type SchedulingEventTypeId } from "@/lib/scheduling-event-types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
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

const WEEK_DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function sortWeekSlots<T extends { dayKey: string }>(slots: T[]): T[] {
  return [...slots].sort(
    (a, b) =>
      (WEEK_DAY_ORDER as readonly string[]).indexOf(a.dayKey) -
      (WEEK_DAY_ORDER as readonly string[]).indexOf(b.dayKey),
  );
}

function availabilityPresetLabel(preset: string): string {
  if (preset === "working-hours") return "Default working hours";
  if (preset === "weekday-mornings") return "Weekday mornings";
  if (preset === "custom") return "Custom schedule";
  return preset;
}

export default function SchedulingPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const {
    data: meetingsResponse,
    isLoading: meetingsLoading,
    isError: meetingsError,
  } = useScheduledMeetings(user?.id, { page, pageSize });
  const meetings = meetingsResponse?.items ?? [];
  const totalPages = meetingsResponse?.totalPages ?? 1;
  const total = meetingsResponse?.total ?? 0;
  const selected = useDashboardUiStore((s) => s.lastEventTypeChoice);
  const setSelected = useDashboardUiStore((s) => s.setLastEventTypeChoice);
  const [activeKind, setActiveKind] = useState<SchedulingEventTypeId | null>(null);
  const selectedType = SCHEDULING_EVENT_TYPES.find((x) => x.id === (activeKind ?? selected)) ?? SCHEDULING_EVENT_TYPES[0];
  const [createOpen, setCreateOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupMode, setSetupMode] = useState<"create" | "edit">("create");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loadingEditEvent, setLoadingEditEvent] = useState(false);
  const [rowMenuOpenFor, setRowMenuOpenFor] = useState<string | null>(null);
  const [detailMeeting, setDetailMeeting] = useState<ScheduledMeeting | null>(null);
  const [detailEventDetail, setDetailEventDetail] = useState<BookingEventTypeDetail | null>(null);
  const [detailEventLoading, setDetailEventLoading] = useState(false);
  const [detailEventError, setDetailEventError] = useState<string | null>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
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
    bookingPageTheme: "simple" as BookingPageThemeId,
    paymentEnabled: false,
    paymentProvider: "razorpay" as MeetingPaymentProviderId,
    paymentAmountRupees: "",
    paymentLabel: "",
  });
  const [customHours, setCustomHours] = useState<DaySchedule[]>(
    DEFAULT_WORKING_HOURS.map((d) => ({ ...d })),
  );
  const [savingEvent, setSavingEvent] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [pendingDeleteMeeting, setPendingDeleteMeeting] = useState<ScheduledMeeting | null>(null);

  useEffect(() => {
    if (!setupOpen) {
      setActiveKind(null);
    }
  }, [setupOpen]);

  useEffect(() => {
    // Only trigger chooseType (which is for NEW events) if we aren't already 
    // in the process of editing an existing event.
    if (selected && !setupOpen && !loadingEditEvent) {
      chooseType(selected as SchedulingEventTypeId);
      setSelected(null);
    }
  }, [selected, setSelected, setupOpen, loadingEditEvent]);

  function chooseType(id: SchedulingEventTypeId) {
    setSetupMode("create");
    setEditingEventId(null);
    setActiveKind(id);
    setSelected(null);
    const type = SCHEDULING_EVENT_TYPES.find((x) => x.id === id);
    setForm((prev) => ({
      ...prev,
      eventName: type ? `${type.durationMinutes} min ${type.title}` : prev.eventName,
      duration: type ? String(type.durationMinutes) : prev.duration,
      bookingPageTheme: "simple",
      paymentEnabled: false,
      paymentProvider: "razorpay",
      paymentAmountRupees: "",
      paymentLabel: "",
    }));
    setCreateOpen(false);
    setSetupOpen(true);
  }

  function EventTypeIcon({ id }: { id: SchedulingEventTypeId }) {
    if (id === "one-on-one") return <UserIcon className="h-4 w-4" aria-hidden />;
    if (id === "group") return <UserGroupIcon className="h-4 w-4" aria-hidden />;
    return <ArrowPathIcon className="h-4 w-4" aria-hidden />;
  }

  async function handleSaveEvent() {
    if (!selectedType) return;
    if (!form.eventName.trim()) {
      showToast({ kind: "error", title: "Event name required", message: "Please enter an event name." });
      return;
    }
    const durationMinutes = Number(form.duration);
    const bufferBeforeMinutes = Number(form.bufferBefore);
    const bufferAfterMinutes = Number(form.bufferAfter);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      showToast({ kind: "error", title: "Invalid duration", message: "Duration must be greater than 0." });
      return;
    }
    if (form.paymentEnabled) {
      if (form.paymentProvider !== "razorpay") {
        showToast({
          kind: "error",
          title: "Payment provider",
          message: "Only Razorpay is available right now.",
        });
        return;
      }
      const rupees = Number(form.paymentAmountRupees);
      if (!Number.isFinite(rupees) || rupees < 1) {
        showToast({
          kind: "error",
          title: "Invalid amount",
          message: "Enter the meeting fee in INR (minimum ₹1).",
        });
        return;
      }
      if (!form.paymentLabel.trim()) {
        showToast({
          kind: "error",
          title: "Payment description",
          message: "Add a short label (e.g. Consultation fee) for the checkout screen.",
        });
        return;
      }
    }

    setSavingEvent(true);
    try {
      const client = await getSupabaseBrowserClient();
      if (!client) {
        showToast({ kind: "error", title: "Configuration error", message: "Supabase is not configured." });
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error || !data.session?.access_token || !data.session.user?.id) {
        showToast({ kind: "error", title: "Not signed in", message: "Please sign in again and retry." });
        return;
      }

      const sourceHours = form.availability === "custom" ? customHours : DEFAULT_WORKING_HOURS;
      const paymentAmountPaisa =
        form.paymentEnabled && Number.isFinite(Number(form.paymentAmountRupees))
          ? Math.round(Number(form.paymentAmountRupees) * 100)
          : null;
      const payload = {
        kind: selectedType.id,
        eventName: form.eventName.trim(),
        durationMinutes,
        location: form.location,
        description: form.description.trim() || undefined,
        availabilityPreset: form.availability,
        minNotice: form.minNotice,
        bufferBeforeMinutes,
        bufferAfterMinutes,
        bookingWindow: form.bookingWindow,
        bookingQuestion: form.bookingQuestion.trim() || undefined,
        bookingPageTheme: normalizeBookingPageTheme(form.bookingPageTheme),
        weekSlots: sourceHours.map((h) => ({
          dayKey: h.day,
          enabled: h.enabled,
          startTime: h.start,
          endTime: h.end,
        })),
        paymentEnabled: form.paymentEnabled,
        paymentProvider: form.paymentEnabled ? form.paymentProvider : null,
        paymentAmountPaisa: form.paymentEnabled ? paymentAmountPaisa : null,
        paymentLabel: form.paymentEnabled ? form.paymentLabel.trim() : null,
      };
      if (setupMode === "edit" && editingEventId) {
        await updateBookingEventType(data.session.access_token, {
          ...payload,
          id: editingEventId,
          description: form.description.trim(),
          bookingQuestion: form.bookingQuestion.trim(),
          bookingPageTheme: normalizeBookingPageTheme(form.bookingPageTheme),
          paymentEnabled: form.paymentEnabled,
          paymentProvider: form.paymentEnabled ? form.paymentProvider : null,
          paymentAmountPaisa: form.paymentEnabled ? paymentAmountPaisa : null,
          paymentLabel: form.paymentEnabled ? form.paymentLabel.trim() : null,
        });
      } else {
        await createBookingEventType(data.session.access_token, payload);
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.meetings.root,
      });
      setPage(1);
      showToast({
        kind: "success",
        title: setupMode === "edit" ? `"${form.eventName.trim()}" updated` : "Event saved",
        message:
          setupMode === "edit"
            ? "Event details have been updated."
            : "Your booking event type is ready.",
      });
      setSetupOpen(false);
    } catch {
      showToast({
        kind: "error",
        title: setupMode === "edit" ? "Update failed" : "Save failed",
        message: "Could not save event type. Try again.",
      });
    } finally {
      setSavingEvent(false);
    }
  }

  async function openEditDrawerForMeeting(meeting: ScheduledMeeting) {
    const eventId = meeting.id.startsWith("evt-") ? meeting.id.slice(4) : meeting.id;
    setLoadingEditEvent(true);
    let detail: Awaited<ReturnType<typeof fetchBookingEventType>> | null = null;
    try {
      detail = await withAccessToken((accessToken) => fetchBookingEventType(accessToken, eventId));
    } finally {
      setLoadingEditEvent(false);
    }
    if (!detail) return;
    
    // Clear global selection to prevent it from triggering the "Create" flow later
    setSelected(null);

    setSetupMode("edit");
    setEditingEventId(detail.id);
    setActiveKind(detail.kind);
    setForm({
      eventName: detail.eventName,
      duration: String(detail.durationMinutes),
      location: detail.location,
      description: detail.description ?? "",
      availability: detail.availabilityPreset,
      minNotice: detail.minNotice,
      bufferBefore: String(detail.bufferBeforeMinutes),
      bufferAfter: String(detail.bufferAfterMinutes),
      bookingWindow: detail.bookingWindow,
      bookingQuestion: detail.bookingQuestion ?? "",
      bookingPageTheme: normalizeBookingPageTheme(detail.bookingPageTheme) as BookingPageThemeId,
      paymentEnabled: detail.paymentEnabled,
      paymentProvider: (detail.paymentProvider as MeetingPaymentProviderId) || "razorpay",
      paymentAmountRupees:
        detail.paymentAmountPaisa != null ? String(detail.paymentAmountPaisa / 100) : "",
      paymentLabel: detail.paymentLabel ?? "",
    });
    setCustomHours(
      DEFAULT_WORKING_HOURS.map((defaultRow) => {
        const match = detail.weekSlots.find((slot) => slot.dayKey === defaultRow.day);
        return match
          ? { day: defaultRow.day, enabled: match.enabled, start: match.startTime, end: match.endTime }
          : { ...defaultRow };
      }),
    );
    setDetailMeeting(null);
    setSetupOpen(true);
  }

  function bookingLinkForMeeting(meetingId: string): string {
    if (typeof window === "undefined") return "";
    const base = window.location.origin;
    const cleanId = meetingId.startsWith("evt-") ? meetingId.slice(4) : meetingId;
    return `${base}/book/${user?.id ?? "host"}?event=${encodeURIComponent(cleanId)}`;
  }

  async function handleCopyMeetingLink(meetingId: string) {
    const link = bookingLinkForMeeting(meetingId);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showToast({ kind: "success", title: "Link copied", message: "Booking link copied to clipboard." });
    } catch {
      showToast({ kind: "error", title: "Copy failed", message: "Could not copy link. Please try again." });
    }
  }

  function handleOpenMeetingLink(meetingLink: string | null | undefined) {
    if (!meetingLink) {
      showToast({
        kind: "info",
        title: "No meeting link yet",
        message: "This row does not have an auto-generated meeting link.",
      });
      return;
    }
    window.open(meetingLink, "_blank", "noopener,noreferrer");
  }

  function handleOpenMeetingBooking(meetingId: string) {
    const link = bookingLinkForMeeting(meetingId);
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function withAccessToken<T>(fn: (accessToken: string) => Promise<T>): Promise<T | null> {
    const client = await getSupabaseBrowserClient();
    if (!client) {
      showToast({ kind: "error", title: "Configuration error", message: "Supabase is not configured." });
      return null;
    }
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) {
      showToast({ kind: "error", title: "Session expired", message: "Please sign in again." });
      return null;
    }
    return fn(data.session.access_token);
  }

  async function handleRowAction(action: "edit" | "delete" | "toggle", meeting: ScheduledMeeting) {
    const eventId = meeting.id.startsWith("evt-") ? meeting.id.slice(4) : meeting.id;
    if (action === "toggle") {
      showToast({
        kind: "info",
        title: "On / Off coming soon",
        message: `On / Off action for "${meeting.title}" will be wired next.`,
      });
      return;
    }

    if (action === "edit") {
      await openEditDrawerForMeeting(meeting);
      return;
    }

    setPendingDeleteMeeting(meeting);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteMeeting) return;
    const eventId = pendingDeleteMeeting.id.startsWith("evt-")
      ? pendingDeleteMeeting.id.slice(4)
      : pendingDeleteMeeting.id;
    setDeletingEvent(true);
    try {
      const ok = await withAccessToken((accessToken) => deleteScheduledEvent(accessToken, { id: eventId }));
      if (!ok) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.meetings.root });
      showToast({
        kind: "success",
        title: `"${pendingDeleteMeeting.title}" deleted`,
        message: "Event removed from My Events.",
      });
      if (detailMeeting?.id === pendingDeleteMeeting.id) {
        setDetailMeeting(null);
      }
      setDeleteDialogOpen(false);
      setPendingDeleteMeeting(null);
    } finally {
      setDeletingEvent(false);
    }
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

  useEffect(() => {
    if (!rowMenuOpenFor) return;
    function onPointerDown(e: MouseEvent) {
      if (!rowMenuRef.current) return;
      if (!rowMenuRef.current.contains(e.target as Node)) {
        setRowMenuOpenFor(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [rowMenuOpenFor]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!detailMeeting) {
      setDetailEventDetail(null);
      setDetailEventError(null);
      setDetailEventLoading(false);
      return;
    }
    const eventId = detailMeeting.id.startsWith("evt-") ? detailMeeting.id.slice(4) : detailMeeting.id;
    let cancelled = false;
    setDetailEventLoading(true);
    setDetailEventError(null);
    setDetailEventDetail(null);
    void (async () => {
      try {
        const client = await getSupabaseBrowserClient();
        if (!client) throw new Error("Supabase not configured");
        const { data, error } = await client.auth.getSession();
        if (error || !data.session?.access_token) throw new Error("Not signed in");
        const detail = await fetchBookingEventType(data.session.access_token, eventId);
        if (!cancelled) setDetailEventDetail(detail);
      } catch (e) {
        if (!cancelled) {
          setDetailEventError(e instanceof Error ? e.message : "Could not load event details.");
          setDetailEventDetail(null);
        }
      } finally {
        if (!cancelled) setDetailEventLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailMeeting]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredMeetings = meetings.filter((m) => {
    if (filter === "all") return true;
    if (filter === "active") return m.status === "Upcoming";
    if (filter === "inactive") return m.status !== "Upcoming";
    return true;
  });

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-5xl space-y-8 py-4"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Scheduling</h1>
          <p className="mt-2 text-base text-zinc-500 max-w-lg">
            Create and manage your event types. Share your links to let clients book meetings directly into your calendar.
          </p>
        </div>
        
        <div ref={createMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCreateOpen((s) => !s)}
            className="group inline-flex items-center gap-2 rounded-xl bg-[var(--app-primary)] px-6 py-3 text-sm font-bold text-[var(--app-primary-foreground)] shadow-lg shadow-[var(--app-ring)] transition-all hover:bg-[var(--app-primary-hover)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden />
            Create Event
          </button>

          <AnimatePresence>
            {createOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-[calc(100%+0.75rem)] right-0 z-40 w-[26rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl"
              >
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Choose Event Type</h3>
                </div>

                <ChooseEventTypeMenu onSelect={chooseType} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Events List */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">My Events</h2>
            
            {/* Filter Chips */}
            <div className="relative flex items-center bg-zinc-100/80 p-1 rounded-xl ring-1 ring-zinc-200">
              {(["all", "active", "inactive"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={[
                    "relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors z-10",
                    filter === type ? "text-[var(--app-primary)]" : "text-zinc-500 hover:text-zinc-700"
                  ].join(" ")}
                >
                  {type}
                  {filter === type && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs font-bold text-zinc-400 tabular-nums">
            {meetingsLoading ? "..." : `${filteredMeetings.length} SHOWN`}
          </span>
        </div>

        {meetingsError && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center">
            <XMarkIcon className="w-10 h-10 text-rose-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-rose-900">Could not load meetings</p>
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.meetings.root })}
              className="mt-4 text-xs font-bold text-rose-700 underline underline-offset-4"
            >
              Try Refreshing
            </button>
          </div>
        )}

        {!meetingsError && meetingsLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-zinc-100 bg-white p-6 animate-pulse" />
            ))}
          </div>
        )}

        {!meetingsError && !meetingsLoading && meetings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 ring-1 ring-zinc-100">
              <CalendarDaysIcon className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">No events yet</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-xs mx-auto font-medium">
              Create your first event type to start accepting bookings from your clients.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)] transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create your first event
            </button>
          </div>
        )}

        {!meetingsError && !meetingsLoading && meetings.length > 0 && filteredMeetings.length === 0 && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center">
            <RocketLaunchIcon className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-zinc-500">No {filter} events found</p>
            <button
              onClick={() => setFilter("all")}
              className="mt-2 text-xs font-bold text-[var(--app-primary)] hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {!meetingsError && !meetingsLoading && filteredMeetings.length > 0 && (
          <>
            <motion.div 
              layout
              className="grid gap-6 sm:grid-cols-2"
            >
              {filteredMeetings.map((meeting, idx) => (
                <motion.div
                  key={meeting.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={[
                    "group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-[var(--app-ring)]",
                    meeting.status === "Upcoming" ? "border-zinc-200 hover:border-[var(--app-primary-soft-border)]" : "border-zinc-100 opacity-75 grayscale-[0.5]"
                  ].join(" ")}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setDetailMeeting(meeting)}
                        className="text-left group/title flex-1 min-w-0"
                      >
                        <h3 className="truncate text-lg font-bold text-zinc-900 group-hover/title:text-[var(--app-primary)] transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-zinc-500">
                          <span className="truncate">{meeting.guest}</span>
                          <span>·</span>
                          <span className="shrink-0">{meeting.platform}</span>
                        </div>
                      </button>
                      
                      <div ref={rowMenuOpenFor === meeting.id ? rowMenuRef : null} className="relative shrink-0">
                        <button
                          type="button"
                          aria-label={`More actions for ${meeting.title}`}
                          onClick={() => setRowMenuOpenFor((current) => (current === meeting.id ? null : meeting.id))}
                          className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-50 hover:text-zinc-700"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        
                        <AnimatePresence>
                          {rowMenuOpenFor === meeting.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute top-[calc(100%+0.5rem)] right-0 z-30 min-w-[12rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-2xl"
                            >
                              <button
                                type="button"
                                onClick={() => { setRowMenuOpenFor(null); void handleRowAction("edit", meeting); }}
                                disabled={loadingEditEvent}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                {loadingEditEvent ? "Loading..." : "Edit Settings"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRowMenuOpenFor(null); handleOpenMeetingBooking(meeting.id); }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
                              >
                                <ArrowUpRightIcon className="h-4 w-4" />
                                Preview Booking
                              </button>
                              <div className="my-1.5 border-t border-zinc-100" />
                              <button
                                type="button"
                                onClick={() => { setRowMenuOpenFor(null); void handleRowAction("delete", meeting); }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                                Delete Event
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 text-zinc-600 rounded-lg text-xs font-bold border border-zinc-100 shadow-sm">
                          <VideoCameraIcon className="w-3.5 h-3.5" />
                          {meeting.platform}
                        </div>
                        <div className={[
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors",
                          meeting.status === "Upcoming" ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]" : "bg-zinc-100 text-zinc-500"
                        ].join(" ")}>
                          <ClockIcon className="w-3.5 h-3.5" />
                          {meeting.status === "Upcoming" ? "Active" : "Paused"}
                        </div>
                      </div>

                      {/* Premium Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleRowAction("toggle", meeting)}
                        className={[
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:ring-offset-2",
                          meeting.status === "Upcoming" ? "bg-[var(--app-primary)]" : "bg-zinc-300"
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            meeting.status === "Upcoming" ? "translate-x-5" : "translate-x-0"
                          ].join(" ")}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopyMeetingLink(meeting.id)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)] transition-colors"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDetailMeeting(meeting)}
                      className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      Settings
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-between border-t border-zinc-100 pt-6 px-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Page {page} <span className="mx-1">/</span> {totalPages}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </motion.div>

      <AnimatePresence>
        {detailMeeting && (
          <>
            <DrawerBackdrop onClick={() => setDetailMeeting(null)} aria-label="Close event details" />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Event Overview</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">{detailMeeting.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailMeeting(null)}
                  className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-95"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Summary Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status & Schedule</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className={[
                      "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm",
                      detailMeeting.status === "Upcoming"
                        ? "bg-[var(--app-primary)] text-white"
                        : "bg-zinc-200 text-zinc-600",
                    ].join(" ")}>
                      <ClockIcon className="h-4 w-4" />
                      {detailMeeting.status === "Upcoming" ? "Active" : "Inactive"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-100">
                      <CalendarDaysIcon className="h-4 w-4 text-[var(--app-primary)]" />
                      {detailMeeting.time}
                    </span>
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">ID: {detailMeeting.id.replace(/^evt-/, "")}</p>
                </motion.div>

                {detailEventLoading && (
                  <div className="p-8 text-center rounded-3xl border border-dashed border-zinc-200 animate-pulse">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Fetching details...</p>
                  </div>
                )}
                
                {detailEventError && !detailEventLoading && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
                    <p className="text-sm font-bold text-rose-900">{detailEventError}</p>
                  </div>
                )}

                {detailEventDetail && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-3xl border border-zinc-200 p-6 shadow-sm"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Configuration</p>
                      <dl className="mt-6 space-y-4">
                        {[
                          { label: "Duration", value: `${detailEventDetail.durationMinutes} min` },
                          { label: "Location", value: bookingLocationLabel(detailEventDetail.location) },
                          { label: "Availability", value: availabilityPresetLabel(detailEventDetail.availabilityPreset) },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <dt className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.label}</dt>
                            <dd className="text-sm font-black text-zinc-900">{item.value}</dd>
                          </div>
                        ))}
                        {detailEventDetail.paymentEnabled && (
                          <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                            <dt className="text-xs font-bold text-[var(--app-primary)] uppercase tracking-wider">Meeting Fee</dt>
                            <dd className="text-sm font-black text-zinc-900">
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0
                              }).format(detailEventDetail.paymentAmountPaisa! / 100)}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-3xl border border-zinc-100 bg-zinc-50/30 p-6"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Weekly Schedule</p>
                      <ul className="mt-4 space-y-2">
                        {sortWeekSlots(detailEventDetail.weekSlots).map((slot) => (
                          <li key={slot.dayKey} className="flex items-center justify-between p-3 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
                            <span className="text-xs font-black text-zinc-900">{slot.dayKey}</span>
                            {slot.enabled ? (
                              <span className="text-xs font-bold text-zinc-500 tabular-nums">
                                {slot.startTime} – {slot.endTime}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Closed</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </>
                )}

                {/* Links & Shares */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="rounded-3xl border border-zinc-200 p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Public Booking URL</p>
                    <p className="mt-3 truncate text-xs font-bold text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      {bookingLinkForMeeting(detailMeeting.id)}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMeetingLink(detailMeeting.id)}
                        className="flex-1 rounded-xl bg-[var(--app-primary)] py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--app-primary-hover)] active:scale-95 shadow-lg shadow-[var(--app-primary-soft)]"
                      >
                        Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMeetingBooking(detailMeeting.id)}
                        className="flex-1 rounded-xl bg-zinc-900 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-lg"
                      >
                        Preview Page
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 gap-3 pb-8"
                >
                  <button
                    type="button"
                    onClick={() => void handleRowAction("edit", detailMeeting)}
                    disabled={loadingEditEvent}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-xs font-black uppercase tracking-widest text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-95"
                  >
                    <PencilSquareIcon className="h-5 w-5 text-zinc-400" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRowAction("delete", detailMeeting)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-black uppercase tracking-widest text-rose-600 shadow-sm transition-all hover:bg-rose-100 active:scale-95"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Delete
                  </button>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {setupOpen && selectedType && (
          <>
            <DrawerBackdrop onClick={() => setSetupOpen(false)} aria-label="Close event setup" />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-zinc-200 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="mb-10 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{selectedType.title} Template</p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">
                      {setupMode === "edit" ? "Modify Event" : "Configure New Event"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSetupOpen(false)}
                    className="rounded-2xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <section className="space-y-6">
                    <Field label="What is this event called?" required>
                      <Input
                        value={form.eventName}
                        onChange={(v) => setForm((s) => ({ ...s, eventName: v }))}
                        placeholder="e.g. 30 min Discovery call"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Duration">
                        <Select
                          value={form.duration}
                          onChange={(v) => setForm((s) => ({ ...s, duration: v }))}
                          options={[
                            { value: "15", label: "15 mins" },
                            { value: "30", label: "30 mins" },
                            { value: "45", label: "45 mins" },
                            { value: "60", label: "60 mins" },
                          ]}
                        />
                      </Field>
                      <Field label="Meeting Platform">
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

                    <Field label="Instructions for Invitee">
                      <TextArea
                        value={form.description}
                        onChange={(v) => setForm((s) => ({ ...s, description: v }))}
                        placeholder="Add context, agenda, or instructions for invitees."
                      />
                    </Field>
                  </section>

                  <section className="space-y-6 rounded-3xl bg-zinc-50 p-6 ring-1 ring-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scheduling Logic</p>
                    
                    <Field label="Availability Schedule">
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

                    <div className="space-y-2">
                      {(form.availability === "custom" ? customHours : DEFAULT_WORKING_HOURS).map((row, idx) => (
                        <div key={row.day} className="grid grid-cols-[60px_1fr_14px_1fr] items-center gap-3">
                          <span className="text-xs font-black text-zinc-900">{row.day}</span>
                          <input
                            type="time"
                            value={row.start}
                            disabled={!row.enabled || form.availability !== "custom"}
                            onChange={(e) =>
                              setCustomHours((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, start: e.target.value } : d)),
                              )
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm disabled:opacity-40"
                          />
                          <span className="text-zinc-400 text-center">-</span>
                          <input
                            type="time"
                            value={row.end}
                            disabled={!row.enabled || form.availability !== "custom"}
                            onChange={(e) =>
                              setCustomHours((prev) =>
                                prev.map((d, i) => (i === idx ? { ...d, end: e.target.value } : d)),
                              )
                            }
                            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-800 shadow-sm disabled:opacity-40"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Notice">
                        <Select
                          value={form.minNotice}
                          onChange={(v) => setForm((s) => ({ ...s, minNotice: v }))}
                          options={[
                            { value: "1h", label: "1h" },
                            { value: "4h", label: "4h" },
                            { value: "12h", label: "12h" },
                            { value: "24h", label: "24h" },
                          ]}
                        />
                      </Field>
                      <Field label="Buf. Pre">
                        <Select
                          value={form.bufferBefore}
                          onChange={(v) => setForm((s) => ({ ...s, bufferBefore: v }))}
                          options={[{ value: "0", label: "0m" }, { value: "15", label: "15m" }, { value: "30", label: "30m" }]}
                        />
                      </Field>
                      <Field label="Buf. Post">
                        <Select
                          value={form.bufferAfter}
                          onChange={(v) => setForm((s) => ({ ...s, bufferAfter: v }))}
                          options={[{ value: "0", label: "0m" }, { value: "15", label: "15m" }, { value: "30", label: "30m" }]}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Accept Payments</h3>
                          <p className="mt-1 text-xs font-medium text-zinc-500">Collect fees before booking confirmation.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm((s) => ({ ...s, paymentEnabled: !s.paymentEnabled }))}
                          className={[
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                            form.paymentEnabled ? "bg-[var(--app-primary)]" : "bg-zinc-300"
                          ].join(" ")}
                        >
                          <span className={[
                            "h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                            form.paymentEnabled ? "translate-x-5" : "translate-x-1"
                          ].join(" ")} />
                        </button>
                      </div>
                      {form.paymentEnabled && (
                        <div className="mt-8 space-y-6 pt-6 border-t border-zinc-100">
                          <Field label="Payment Provider">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-primary)] bg-[var(--app-primary-soft)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--app-primary-soft-text)] shadow-sm"
                              >
                                <div className="h-2 w-2 rounded-full bg-[var(--app-primary)] animate-pulse" />
                                Razorpay
                              </button>
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 opacity-50 cursor-not-allowed"
                              >
                                Stripe (Coming Soon)
                              </button>
                            </div>
                          </Field>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Price (INR)" required>
                              <Input
                                value={form.paymentAmountRupees}
                                onChange={(v) => setForm((s) => ({ ...s, paymentAmountRupees: v.replace(/[^\d.]/g, "") }))}
                                placeholder="500"
                                inputMode="decimal"
                              />
                            </Field>
                            <Field label="Checkout Label" required>
                              <Input
                                value={form.paymentLabel}
                                onChange={(v) => setForm((s) => ({ ...s, paymentLabel: v }))}
                                placeholder="e.g. Service Fee"
                              />
                            </Field>
                          </div>
                          
                          <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                            Note: Ensure you have connected your Razorpay keys in the Integrations tab to accept live payments.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Page Aesthetics</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {BOOKING_PAGE_THEME_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setForm((s) => ({ ...s, bookingPageTheme: opt.id }))}
                            className={[
                              "rounded-2xl border p-4 text-left transition-all",
                              form.bookingPageTheme === opt.id
                                ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] ring-2 ring-[var(--app-primary)]"
                                : "border-zinc-100 bg-zinc-50 hover:border-zinc-200"
                            ].join(" ")}
                          >
                            <span className="block text-xs font-black text-zinc-900">{opt.label}</span>
                            <span className="mt-1 block text-[10px] font-medium text-zinc-500 leading-snug">{opt.hint}</span>
                          </button>
                        ))}
                      </div>

                      <div className="mt-8 rounded-2xl border border-dashed border-zinc-200 p-6 bg-zinc-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Preview</p>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 ring-1 ring-emerald-100">
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            Dynamic
                          </span>
                        </div>
                        <div className="mx-auto max-w-[240px]">
                          <BookingPageThemePreview themeId={form.bookingPageTheme} />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="shrink-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 p-8 flex items-center justify-end gap-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                <button
                  type="button"
                  onClick={() => setSetupOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-zinc-500 transition hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEvent}
                  onClick={handleSaveEvent}
                  className="rounded-2xl bg-[var(--app-primary)] px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] active:scale-95"
                >
                  {savingEvent ? "Saving..." : setupMode === "edit" ? "Update Event" : "Create Event"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete event?"
        message={
          pendingDeleteMeeting
            ? `Delete "${pendingDeleteMeeting.title}"? This will remove it from My Events.`
            : "Delete this event?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        busy={deletingEvent}
        onCancel={() => {
          if (deletingEvent) return;
          setDeleteDialogOpen(false);
          setPendingDeleteMeeting(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />

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
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric" | "text" | "tel" | "email";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
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

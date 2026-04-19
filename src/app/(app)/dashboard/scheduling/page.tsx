"use client";

import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
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
} from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BookingPageThemePreview } from "@/components/booking/BookingPageThemePreview";
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

  function chooseType(id: SchedulingEventTypeId) {
    setSetupMode("create");
    setEditingEventId(null);
    setSelected(id);
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
    setSetupMode("edit");
    setEditingEventId(detail.id);
    setSelected(detail.kind);
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

  const selectedType = SCHEDULING_EVENT_TYPES.find((x) => x.id === selected) ?? null;

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Scheduling</h1>
            <p className="mt-1 text-sm text-zinc-600">
              All your created events appear here. Use Create to add a new event type.
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
            <h2 className="text-sm font-semibold text-zinc-900">My Events</h2>
            <p className="text-xs text-zinc-500">
              {meetingsLoading ? "…" : `${total} total`}
            </p>
          </div>
          {meetingsError && (
            <p className="px-2 py-4 text-sm text-rose-600">Could not load meetings. Try refreshing.</p>
          )}
          {!meetingsError && meetingsLoading && (
            <p className="px-2 py-4 text-sm text-zinc-500">Loading meetings…</p>
          )}
          {!meetingsError && !meetingsLoading && meetings.length === 0 && (
            <p className="px-2 py-4 text-sm text-zinc-500">
              No host-created meetings yet. Create an event type to get a booking link, or add meetings from
              your tools.
            </p>
          )}
          {!meetingsError && !meetingsLoading && meetings.length > 0 && (
            <>
              <ul className="divide-y divide-zinc-100">
                {meetings.map((meeting) => (
                  <li
                    key={meeting.id}
                    className="flex items-start justify-between gap-4 px-2 py-3 transition hover:bg-zinc-50/80"
                  >
                    <button
                      type="button"
                      onClick={() => setDetailMeeting(meeting)}
                      className="min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]"
                    >
                      <p className="truncate text-sm font-semibold text-zinc-900">{meeting.title}</p>
                      <p className="text-xs text-zinc-500">
                        {meeting.eventType} · {meeting.platform} · {meeting.guest}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 text-xs text-zinc-500">
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
                    </button>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopyMeetingLink(meeting.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                        Copy link
                      </button>
                      <div ref={rowMenuOpenFor === meeting.id ? rowMenuRef : null} className="relative">
                        <button
                          type="button"
                          aria-label={`More actions for ${meeting.title}`}
                          onClick={() =>
                            setRowMenuOpenFor((current) => (current === meeting.id ? null : meeting.id))
                          }
                          className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                        >
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        {rowMenuOpenFor === meeting.id && (
                          <div className="absolute top-[calc(100%+0.35rem)] right-0 z-30 min-w-[10rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setRowMenuOpenFor(null);
                                void handleRowAction("edit", meeting);
                              }}
                              disabled={loadingEditEvent}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              {loadingEditEvent ? "Loading..." : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRowMenuOpenFor(null);
                                void handleRowAction("delete", meeting);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRowMenuOpenFor(null);
                                handleOpenMeetingBooking(meeting.id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <LinkIcon className="h-4 w-4" />
                              Go to booking
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRowMenuOpenFor(null);
                                void handleRowAction("toggle", meeting);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                            >
                              <PowerIcon className="h-4 w-4" />
                              On / Off
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between px-2">
                <p className="text-xs text-zinc-500">
                  Page {page} of {totalPages}
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

      {detailMeeting && (
        <>
          <DrawerBackdrop onClick={() => setDetailMeeting(null)} aria-label="Close event details" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Event type</p>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">{detailMeeting.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailMeeting(null)}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close details"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Summary</p>
                <p className="mt-1 text-zinc-700">
                  {detailMeeting.eventType} · {detailMeeting.platform} · {detailMeeting.guest}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {detailMeeting.time}
                  </span>
                  <span
                    className={[
                      "rounded-md px-2 py-1 text-xs font-medium",
                      detailMeeting.status === "Upcoming"
                        ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                        : "bg-zinc-100 text-zinc-600",
                    ].join(" ")}
                  >
                    {detailMeeting.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Event ID: {detailMeeting.id.replace(/^evt-/, "")}</p>
              </div>

              {detailEventLoading && (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-500">
                  Loading schedule and booking page details…
                </div>
              )}
              {detailEventError && !detailEventLoading && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
                  {detailEventError}
                </div>
              )}
              {detailEventDetail && (
                <>
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Event settings</p>
                    <dl className="mt-2 space-y-1.5 text-xs text-zinc-700">
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-500">Duration</dt>
                        <dd>{detailEventDetail.durationMinutes} min</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-500">Location</dt>
                        <dd className="text-right">{bookingLocationLabel(detailEventDetail.location)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-zinc-500">Availability base</dt>
                        <dd className="text-right">{availabilityPresetLabel(detailEventDetail.availabilityPreset)}</dd>
                      </div>
                      {(detailEventDetail.bufferBeforeMinutes > 0 ||
                        detailEventDetail.bufferAfterMinutes > 0) && (
                        <div className="flex justify-between gap-2">
                          <dt className="text-zinc-500">Buffers</dt>
                          <dd className="text-right">
                            Before {detailEventDetail.bufferBeforeMinutes}m · After{" "}
                            {detailEventDetail.bufferAfterMinutes}m
                          </dd>
                        </div>
                      )}
                      {detailEventDetail.paymentEnabled &&
                        detailEventDetail.paymentProvider === "razorpay" &&
                        detailEventDetail.paymentAmountPaisa != null && (
                          <>
                            <div className="flex justify-between gap-2">
                              <dt className="text-zinc-500">Meeting payment</dt>
                              <dd className="text-right">Razorpay</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-zinc-500">Fee</dt>
                              <dd className="text-right">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(detailEventDetail.paymentAmountPaisa / 100)}
                              </dd>
                            </div>
                            {detailEventDetail.paymentLabel ? (
                              <div className="flex justify-between gap-2">
                                <dt className="text-zinc-500">Checkout label</dt>
                                <dd className="text-right">{detailEventDetail.paymentLabel}</dd>
                              </div>
                            ) : null}
                          </>
                        )}
                    </dl>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Weekly hours</p>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-700">
                      {sortWeekSlots(detailEventDetail.weekSlots).map((slot) => (
                        <li key={slot.dayKey} className="flex justify-between gap-2">
                          <span className="font-medium text-zinc-800">{slot.dayKey}</span>
                          {slot.enabled ? (
                            <span className="text-zinc-600">
                              {slot.startTime} – {slot.endTime}
                            </span>
                          ) : (
                            <span className="text-zinc-400">Not available</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Public booking link</p>
                <p className="mt-1 break-all text-xs text-zinc-600">{bookingLinkForMeeting(detailMeeting.id)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyMeetingLink(detailMeeting.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMeetingBooking(detailMeeting.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Open booking page
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Meeting link</p>
                {detailMeeting.meetingLink ? (
                  <>
                    <p className="mt-1 break-all text-xs text-zinc-600">{detailMeeting.meetingLink}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenMeetingLink(detailMeeting.meetingLink)}
                      className="mt-2 inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Open meeting link
                    </button>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-zinc-500">No meeting link generated yet for this event.</p>
                )}
              </div>

              {detailEventDetail && (
                <div className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Guest booking page</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {BOOKING_PAGE_THEME_OPTIONS.find(
                      (o) => o.id === normalizeBookingPageTheme(detailEventDetail.bookingPageTheme),
                    )?.label ?? "Simple"}
                  </p>
                  <div className="mt-3 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                    <BookingPageThemePreview
                      themeId={
                        normalizeBookingPageTheme(detailEventDetail.bookingPageTheme) as BookingPageThemeId
                      }
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRowAction("edit", detailMeeting)}
                    disabled={loadingEditEvent}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    {loadingEditEvent ? "Loading..." : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRowAction("toggle", detailMeeting)}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <PowerIcon className="h-3.5 w-3.5" />
                    On / Off
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRowAction("delete", detailMeeting)}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenMeetingBooking(detailMeeting.id);
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Go to booking
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {setupOpen && selectedType && (
        <>
          <DrawerBackdrop onClick={() => setSetupOpen(false)} aria-label="Close event setup" />
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{selectedType.title} event</p>
                <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
                  {setupMode === "edit" ? "Edit event type" : "Set up event type"}
                </h3>
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

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                <div className="flex items-start gap-2">
                  <BanknotesIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Meeting payment (optional)
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Require a fee before the slot is confirmed. Guests pay on your public booking page via
                      Razorpay (more providers later).
                    </p>
                  </div>
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={form.paymentEnabled}
                    onChange={(e) => setForm((s) => ({ ...s, paymentEnabled: e.target.checked }))}
                    className="h-4 w-4 rounded border-zinc-300 text-[var(--app-primary)] focus:ring-[var(--app-ring)]"
                  />
                  <span>Accept payment for this meeting</span>
                </label>
                {form.paymentEnabled && (
                  <div className="mt-3 space-y-3 border-t border-zinc-200/80 pt-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Provider
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MEETING_PAYMENT_PROVIDER_CHIPS.map((chip) => {
                          const active =
                            !chip.disabled && chip.providerId && form.paymentProvider === chip.providerId;
                          return (
                            <button
                              key={chip.key}
                              type="button"
                              disabled={Boolean(chip.disabled)}
                              onClick={() => {
                                if (chip.disabled || !chip.providerId) return;
                                setForm((s) => ({ ...s, paymentProvider: chip.providerId! }));
                              }}
                              className={[
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                                chip.disabled
                                  ? "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400"
                                  : active
                                    ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                              ].join(" ")}
                              title={chip.hint}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Amount (INR)">
                        <Input
                          value={form.paymentAmountRupees}
                          onChange={(v) => setForm((s) => ({ ...s, paymentAmountRupees: v.replace(/[^\d.]/g, "") }))}
                          placeholder="500"
                          inputMode="decimal"
                        />
                      </Field>
                      <Field label="Checkout label">
                        <Input
                          value={form.paymentLabel}
                          onChange={(v) => setForm((s) => ({ ...s, paymentLabel: v }))}
                          placeholder="Consultation fee"
                        />
                      </Field>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      Guests pay with <strong>your</strong> Razorpay account. Connect keys under{" "}
                      <Link href="/dashboard/integrations/razorpay" className="font-medium text-[var(--app-primary)] underline">
                        Integrations → Razorpay
                      </Link>{" "}
                      (Key ID, Key Secret, and optional webhook). Platform subscription billing uses separate env keys.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Custom theme for booking page
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Guests see this style on your public link. Pick one theme — preview updates below.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BOOKING_PAGE_THEME_OPTIONS.map((opt) => {
                    const active = form.bookingPageTheme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setForm((s) => ({
                            ...s,
                            bookingPageTheme: opt.id,
                          }))
                        }
                        className={[
                          "rounded-lg border px-2.5 py-2 text-left transition",
                          active
                            ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary)]"
                            : "border-zinc-200 bg-white hover:border-zinc-300",
                        ].join(" ")}
                      >
                        <span className="block text-xs font-semibold text-zinc-900">{opt.label}</span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Live preview</p>
                <div className="mt-2 max-w-sm">
                  <BookingPageThemePreview themeId={form.bookingPageTheme} />
                </div>
              </div>

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
                disabled={savingEvent}
                onClick={handleSaveEvent}
                className="rounded-full bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)]"
              >
                {savingEvent ? "Saving..." : setupMode === "edit" ? "Update event" : "Save event"}
              </button>
            </div>
          </aside>
        </>
      )}

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

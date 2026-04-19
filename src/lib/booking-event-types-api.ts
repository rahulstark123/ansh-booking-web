import type { SchedulingEventTypeId } from "@/lib/scheduling-event-types";

export type BookingWeekSlotInput = {
  dayKey: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type CreateBookingEventTypeInput = {
  kind: SchedulingEventTypeId;
  eventName: string;
  durationMinutes: number;
  location: string;
  description?: string;
  availabilityPreset: string;
  minNotice: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  bookingWindow: string;
  bookingQuestion?: string;
  /** Public booking page layout: simple | vintage | modern | compact | editorial */
  bookingPageTheme?: string;
  weekSlots: BookingWeekSlotInput[];
  /** When true, guests pay via `paymentProvider` before the booking is confirmed. */
  paymentEnabled?: boolean;
  paymentProvider?: string | null;
  /** Stored in paise (INR smallest unit). */
  paymentAmountPaisa?: number | null;
  /** Dashboard save: amount in rupees (converted to paise on the server). Prefer over paisa when typing INR. */
  paymentAmountRupees?: number;
  /** Checkout / UI label, e.g. Consultation fee */
  paymentLabel?: string | null;
};

export type BookingEventTypeDetail = {
  id: string;
  kind: SchedulingEventTypeId;
  eventName: string;
  durationMinutes: number;
  location: string;
  description: string;
  availabilityPreset: string;
  minNotice: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  bookingWindow: string;
  bookingQuestion: string;
  bookingPageTheme: string;
  weekSlots: BookingWeekSlotInput[];
  paymentEnabled: boolean;
  paymentProvider: string | null;
  paymentAmountPaisa: number | null;
  /** Optional on PATCH body from dashboard (rupees). */
  paymentAmountRupees?: number;
  paymentLabel: string | null;
};

export async function createBookingEventType(
  accessToken: string,
  payload: CreateBookingEventTypeInput,
): Promise<{ id: string }> {
  const res = await fetch("/api/booking/event-types", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to save event type");
  return (await res.json()) as { id: string };
}

export async function fetchBookingEventType(
  accessToken: string,
  id: string,
): Promise<BookingEventTypeDetail> {
  const query = new URLSearchParams({ id });
  const res = await fetch(`/api/booking/event-types?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load event type");
  return (await res.json()) as BookingEventTypeDetail;
}

export async function updateBookingEventType(
  accessToken: string,
  payload: BookingEventTypeDetail,
): Promise<{ ok: true }> {
  const res = await fetch("/api/booking/event-types", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update event type");
  return (await res.json()) as { ok: true };
}

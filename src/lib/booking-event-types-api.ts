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
  weekSlots: BookingWeekSlotInput[];
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

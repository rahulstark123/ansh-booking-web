import type { BookingEventKind } from "@prisma/client";

import type { SchedulingEventTypeId } from "@/lib/scheduling-event-types";

const TO_PRISMA: Record<SchedulingEventTypeId, BookingEventKind> = {
  "one-on-one": "ONE_ON_ONE",
  group: "GROUP",
  "round-robin": "ROUND_ROBIN",
};

const TO_UI: Record<BookingEventKind, SchedulingEventTypeId> = {
  ONE_ON_ONE: "one-on-one",
  GROUP: "group",
  ROUND_ROBIN: "round-robin",
};

export function schedulingTypeIdToBookingKind(id: SchedulingEventTypeId): BookingEventKind {
  return TO_PRISMA[id];
}

export function bookingKindToSchedulingTypeId(kind: BookingEventKind): SchedulingEventTypeId {
  return TO_UI[kind];
}

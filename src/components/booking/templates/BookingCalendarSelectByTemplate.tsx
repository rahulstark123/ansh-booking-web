"use client";

import { normalizeBookingPageTemplate } from "@/lib/booking-page-templates";

import type { BookingCalendarSelectProps } from "./calendar-select-types";
import { BookingCalendarSelectCompact } from "./BookingCalendarSelectCompact";
import { BookingCalendarSelectEditorial } from "./BookingCalendarSelectEditorial";
import { BookingCalendarSelectModern } from "./BookingCalendarSelectModern";
import { BookingCalendarSelectSimple } from "./BookingCalendarSelectSimple";
import { BookingCalendarSelectVintage } from "./BookingCalendarSelectVintage";

export function BookingCalendarSelectByTemplate({
  templateId,
  ...props
}: BookingCalendarSelectProps & { templateId: string | null | undefined }) {
  const id = normalizeBookingPageTemplate(templateId);
  switch (id) {
    case "vintage":
      return <BookingCalendarSelectVintage {...props} />;
    case "modern":
      return <BookingCalendarSelectModern {...props} />;
    case "compact":
      return <BookingCalendarSelectCompact {...props} />;
    case "editorial":
      return <BookingCalendarSelectEditorial {...props} />;
    case "simple":
    default:
      return <BookingCalendarSelectSimple {...props} />;
  }
}

/** Human-readable label for `BookingEventType.location` values. */
export function bookingLocationLabel(location: string): string {
  if (location === "google-meet") return "Google Meet";
  if (location === "zoom") return "Zoom";
  if (location === "phone") return "Phone call";
  if (location === "in-person") return "In person";
  return location.trim() || "Not set";
}

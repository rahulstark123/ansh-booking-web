import type { ScheduledMeeting } from "@/lib/meetings-data";

export async function fetchScheduledMeetings(accessToken: string): Promise<ScheduledMeeting[]> {
  const res = await fetch("/api/booking/meetings", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load meetings");
  }
  return (await res.json()) as ScheduledMeeting[];
}

export type CreateScheduledMeetingPayload = {
  title: string;
  eventTypeLabel: string;
  guestName: string;
  startsAt: string;
  endsAt?: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  eventTypeId?: string;
};

export async function createScheduledMeeting(
  accessToken: string,
  payload: CreateScheduledMeetingPayload,
): Promise<{ id: string }> {
  const res = await fetch("/api/booking/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to create scheduled meeting");
  }
  return (await res.json()) as { id: string };
}

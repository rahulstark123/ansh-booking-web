import type { ScheduledMeeting } from "@/lib/meetings-data";

export type MeetingsPageResult = {
  items: ScheduledMeeting[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchScheduledMeetings(
  accessToken: string,
  params: { page: number; pageSize: number },
): Promise<MeetingsPageResult> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  const res = await fetch(`/api/booking/meetings?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load meetings");
  }
  return (await res.json()) as MeetingsPageResult;
}

/** Guest bookings from public `/book/...` links (`BookedMeeting` rows). */
export async function fetchBookedMeetings(
  accessToken: string,
  params: { page: number; pageSize: number; filter: "all" | "upcoming" | "completed" },
): Promise<MeetingsPageResult> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    filter: params.filter,
  });
  const res = await fetch(`/api/booking/booked-meetings?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load booked meetings");
  }
  return (await res.json()) as MeetingsPageResult;
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

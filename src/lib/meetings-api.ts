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

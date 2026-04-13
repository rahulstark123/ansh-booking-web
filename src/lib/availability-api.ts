export type WeeklyAvailabilityRow = {
  dayOfWeek: number;
  dayLabel: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export async function fetchWeeklyAvailability(accessToken: string): Promise<WeeklyAvailabilityRow[]> {
  const res = await fetch("/api/booking/availability", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load availability");
  return (await res.json()) as WeeklyAvailabilityRow[];
}

export async function updateWeeklyAvailability(
  accessToken: string,
  rows: WeeklyAvailabilityRow[],
): Promise<{ ok: true }> {
  const res = await fetch("/api/booking/availability", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error("Failed to update availability");
  return (await res.json()) as { ok: true };
}

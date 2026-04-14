export type WeeklyAvailabilityRow = {
  dayOfWeek: number;
  dayLabel: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type AvailabilityOverrideRow = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  label: string | null;
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

export async function fetchAvailabilityOverrides(accessToken: string): Promise<AvailabilityOverrideRow[]> {
  const res = await fetch("/api/booking/availability-overrides", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load availability overrides");
  return (await res.json()) as AvailabilityOverrideRow[];
}

export async function createAvailabilityOverride(
  accessToken: string,
  payload: {
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    isAllDay?: boolean;
    label?: string | null;
  },
): Promise<AvailabilityOverrideRow> {
  const res = await fetch("/api/booking/availability-overrides", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create availability override");
  return (await res.json()) as AvailabilityOverrideRow;
}

export async function deleteAvailabilityOverride(accessToken: string, id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/booking/availability-overrides?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to delete availability override");
  return (await res.json()) as { ok: true };
}

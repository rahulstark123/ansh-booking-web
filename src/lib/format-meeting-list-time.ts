/** Human-readable slot for the scheduling table (e.g. "Today, 4:30 PM"). */
export function formatMeetingListTime(startsAt: Date, now = new Date()): string {
  const d = startsAt;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });

  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(d) - startOf(now)) / 86400000);

  if (dayDiff === 0) return `Today, ${timeStr}`;
  if (dayDiff === 1) return `Tomorrow, ${timeStr}`;
  if (dayDiff === -1) return `Yesterday, ${timeStr}`;

  const weekday = d.toLocaleDateString(undefined, { weekday: "short", timeZone: tz });
  const monthDay = d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: tz });
  return `${weekday}, ${monthDay}, ${timeStr}`;
}

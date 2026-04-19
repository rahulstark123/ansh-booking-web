export type TimeSlot = { iso: string; label: string };

export type BookingCalendarSelectProps = {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  monthTitle: (d: Date) => string;
  calendarDays: Date[];
  weekDays: readonly string[];
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  selectedTimeIso: string | null;
  setSelectedTimeIso: (iso: string | null) => void;
  availableTimes: TimeSlot[];
  timezone: string;
  setTimezone: (tz: string) => void;
  isDateBookable: (d: Date) => boolean;
  sameDate: (a: Date, b: Date) => boolean;
  onContinueToDetails: () => void;
};

"use client";

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Dense single-column flow: small grid + full-width slot stack. */
export function BookingCalendarSelectCompact(p: BookingCalendarSelectProps) {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <h2 className="text-xl font-bold text-zinc-900">Date &amp; time</h2>

      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
          className="rounded p-1 text-zinc-600 hover:bg-white"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-zinc-900">{p.monthTitle(p.currentMonth)}</span>
        <button
          type="button"
          onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
          className="rounded p-1 text-zinc-600 hover:bg-white"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold uppercase text-zinc-500">
        {p.weekDays.map((w, i) => (
          <div key={`w-${i}`} className="py-1">
            {w.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {p.calendarDays.map((date) => {
          const inMonth = date.getMonth() === p.currentMonth.getMonth();
          const canBook = inMonth && p.isDateBookable(date);
          const active = p.selectedDate ? p.sameDate(p.selectedDate, date) : false;
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!canBook}
              onClick={() => {
                if (!canBook) return;
                p.setSelectedDate(new Date(date));
                p.setSelectedTimeIso(null);
              }}
              className={[
                "h-9 rounded-md text-xs font-medium",
                !inMonth ? "text-zinc-300" : "",
                canBook ? "text-blue-800 hover:bg-blue-50" : "text-zinc-400",
                active ? "bg-blue-600 text-white hover:bg-blue-600" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <GlobeAltIcon className="h-3.5 w-3.5" />
        <select
          value={p.timezone}
          onChange={(e) => p.setTimezone(e.target.value)}
          className="flex-1 rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none"
        >
          <option value="Asia/Kolkata">IST</option>
          <option value="Asia/Singapore">SGT</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Times</p>
        {!p.selectedDate && <p className="text-xs text-zinc-500">Select a date.</p>}
        {p.selectedDate && p.availableTimes.length === 0 && (
          <p className="text-xs text-zinc-500">No slots.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {p.selectedDate &&
            p.availableTimes.map((slot) => (
              <button
                key={slot.iso}
                type="button"
                onClick={() => p.setSelectedTimeIso(slot.iso)}
                className={[
                  "rounded-md border px-2 py-2 text-center text-xs font-semibold",
                  p.selectedTimeIso === slot.iso
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
                ].join(" ")}
              >
                {slot.label}
              </button>
            ))}
        </div>
        {p.selectedTimeIso && (
          <button
            type="button"
            onClick={p.onContinueToDetails}
            className="mt-3 w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

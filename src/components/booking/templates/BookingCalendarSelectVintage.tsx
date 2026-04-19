"use client";

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Ledger-style bordered grid + serif + warm paper. */
export function BookingCalendarSelectVintage(p: BookingCalendarSelectProps) {
  return (
    <div className="space-y-8">
      <div className="border-b-2 border-amber-900/25 pb-4">
        <p className="font-serif text-sm font-semibold uppercase tracking-[0.25em] text-amber-900/70">Appointment</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-amber-950 md:text-4xl">Choose day &amp; hour</h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(200px,280px)]">
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-amber-900/20 pb-2">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="rounded border border-amber-900/30 p-1.5 text-amber-950 hover:bg-amber-100/60"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="font-serif text-xl font-semibold text-amber-950">{p.monthTitle(p.currentMonth)}</p>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="rounded border border-amber-900/30 p-1.5 text-amber-950 hover:bg-amber-100/60"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden rounded-sm border-2 border-amber-900/35 bg-amber-950/10 p-1">
            <div className="grid grid-cols-7 gap-px bg-amber-900/35">
              {p.weekDays.map((w, i) => (
                <div
                  key={`w-${i}`}
                  className="bg-[#f0e6d4] py-2 text-center font-serif text-[10px] font-bold uppercase tracking-wider text-amber-950"
                >
                  {w}
                </div>
              ))}
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
                      "min-h-[2.75rem] font-serif text-sm transition",
                      "bg-[#faf6ef]",
                      !inMonth ? "text-amber-900/25" : "",
                      canBook ? "text-amber-950 hover:bg-amber-100" : inMonth ? "text-amber-800/40" : "",
                      active ? "z-[1] bg-amber-200 font-semibold shadow-[inset_0_0_0_2px_rgba(120,53,15,0.55)]" : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 border border-amber-900/25 bg-[#fffdf8] px-3 py-2 font-serif text-sm text-amber-950">
            <GlobeAltIcon className="h-4 w-4 shrink-0" />
            <select
              value={p.timezone}
              onChange={(e) => p.setTimezone(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none"
            >
              <option value="Asia/Kolkata">India Standard Time</option>
              <option value="Asia/Singapore">Singapore Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="border-l-0 border-amber-900/20 pl-0 lg:border-l-2 lg:pl-8">
          <p className="font-serif text-lg font-semibold text-amber-950">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "Select a date"}
          </p>
          <p className="mt-1 font-serif text-xs uppercase tracking-wider text-amber-800/80">Available times</p>
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
            {!p.selectedDate && <li className="font-serif text-sm text-amber-800/70">Pick a day on the calendar.</li>}
            {p.selectedDate && p.availableTimes.length === 0 && (
              <li className="font-serif text-sm text-amber-800/70">No openings this day.</li>
            )}
            {p.selectedDate &&
              p.availableTimes.map((slot) => (
                <li key={slot.iso} className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => p.setSelectedTimeIso(slot.iso)}
                    className={[
                      "min-w-[5.5rem] border-2 px-3 py-2 font-serif text-sm font-semibold transition",
                      p.selectedTimeIso === slot.iso
                        ? "border-amber-900 bg-amber-900 text-[#faf6ef]"
                        : "border-amber-900/35 text-amber-950 hover:border-amber-900/60 hover:bg-amber-50",
                    ].join(" ")}
                  >
                    {slot.label}
                  </button>
                  {p.selectedTimeIso === slot.iso && (
                    <button
                      type="button"
                      onClick={p.onContinueToDetails}
                      className="border-2 border-amber-800 bg-amber-100 px-3 py-2 font-serif text-sm font-semibold text-amber-950 hover:bg-amber-200"
                    >
                      Continue
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

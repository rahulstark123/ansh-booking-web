"use client";

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Magazine layout: large type + narrow calendar band + wide time grid. */
export function BookingCalendarSelectEditorial(p: BookingCalendarSelectProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_minmax(260px,320px)] lg:gap-16">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-500">Scheduling</p>
        <h2 className="mt-4 font-serif text-5xl font-light leading-[1.05] tracking-tight text-zinc-900 md:text-6xl lg:text-7xl">
          Select a
          <br />
          date &amp; time
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-zinc-600">
          Choose an open day, then a start time. You can change time zone before confirming.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 border border-zinc-900 px-4 py-2 text-sm text-zinc-800">
          <GlobeAltIcon className="h-4 w-4" />
          <select
            value={p.timezone}
            onChange={(e) => p.setTimezone(e.target.value)}
            className="bg-transparent font-sans text-sm outline-none"
          >
            <option value="Asia/Kolkata">India Standard Time</option>
            <option value="Asia/Singapore">Singapore Time</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      <div className="space-y-8 border-t border-zinc-200 pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="border border-zinc-900 p-1 text-zinc-900 hover:bg-zinc-900 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="font-serif text-lg text-zinc-900">{p.monthTitle(p.currentMonth)}</p>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="border border-zinc-900 p-1 text-zinc-900 hover:bg-zinc-900 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-zinc-900 text-center text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            {p.weekDays.map((w, i) => (
              <div key={`w-${i}`} className="bg-zinc-100 py-2">
                {w.slice(0, 1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-zinc-900">
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
                    "aspect-square min-h-[2.25rem] text-xs font-medium",
                    "bg-white",
                    !inMonth ? "text-zinc-300" : "",
                    canBook ? "text-zinc-900 hover:bg-zinc-100" : "text-zinc-300",
                    active ? "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-serif text-xl text-zinc-900">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "—"}
          </p>
          {!p.selectedDate && <p className="mt-2 text-sm text-zinc-500">Choose a date in the grid.</p>}
          {p.selectedDate && p.availableTimes.length === 0 && (
            <p className="mt-2 text-sm text-zinc-500">No availability.</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            {p.selectedDate &&
              p.availableTimes.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  onClick={() => p.setSelectedTimeIso(slot.iso)}
                  className={[
                    "border px-2 py-2.5 text-center text-sm font-medium transition",
                    p.selectedTimeIso === slot.iso
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-800 hover:border-zinc-900",
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
              className="mt-6 w-full border-2 border-zinc-900 bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-white hover:text-zinc-900"
            >
              Enter details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Original layout: month grid + right column time list. */
export function BookingCalendarSelectSimple(p: BookingCalendarSelectProps) {
  return (
    <>
      <h2 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900">Select a Date &amp; Time</h2>
      <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <p className="text-2xl font-semibold text-zinc-900">{p.monthTitle(p.currentMonth)}</p>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="rounded-full p-2 text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            {p.weekDays.map((w, i) => (
              <div key={`w-${i}`}>{w}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {p.calendarDays.map((date) => {
              const inMonth = date.getMonth() === p.currentMonth.getMonth();
              const canBook = inMonth && p.isDateBookable(date);
              const active = p.selectedDate ? p.sameDate(p.selectedDate, date) : false;
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    if (!canBook) return;
                    p.setSelectedDate(new Date(date));
                    p.setSelectedTimeIso(null);
                  }}
                  disabled={!canBook}
                  className={[
                    "h-12 rounded-full text-sm transition",
                    !inMonth ? "text-zinc-300" : "",
                    canBook ? "text-blue-700 hover:bg-blue-50" : "text-zinc-400",
                    active ? "bg-blue-100 font-semibold ring-2 ring-blue-300" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="mb-2 text-sm font-semibold text-zinc-700">Time zone</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700">
              <GlobeAltIcon className="h-4 w-4" />
              <select
                value={p.timezone}
                onChange={(e) => p.setTimezone(e.target.value)}
                className="bg-transparent text-zinc-800 outline-none"
              >
                <option value="Asia/Kolkata">India Standard Time</option>
                <option value="Asia/Singapore">Singapore Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-lg font-semibold text-zinc-800">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "Pick a date"}
          </p>
          <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {!p.selectedDate && <p className="text-sm text-zinc-500">Choose a date first.</p>}
            {p.selectedDate && p.availableTimes.length === 0 && (
              <p className="text-sm text-zinc-500">No slots available for this day.</p>
            )}
            {p.selectedDate &&
              p.availableTimes.map((slot) => (
                <div key={slot.iso} className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    type="button"
                    onClick={() => p.setSelectedTimeIso(slot.iso)}
                    className={[
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      p.selectedTimeIso === slot.iso
                        ? "border-zinc-700 bg-zinc-700 text-white"
                        : "border-blue-300 text-blue-700 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    {slot.label}
                  </button>
                  {p.selectedTimeIso === slot.iso && (
                    <button
                      type="button"
                      onClick={p.onContinueToDetails}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Next
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

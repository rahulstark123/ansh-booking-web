"use client";

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Bento-style month cells + pill slot row. */
export function BookingCalendarSelectModern(p: BookingCalendarSelectProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Pick a slot</h2>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
          <GlobeAltIcon className="h-4 w-4" />
          <select
            value={p.timezone}
            onChange={(e) => p.setTimezone(e.target.value)}
            className="bg-transparent text-sm text-slate-800 outline-none"
          >
            <option value="Asia/Kolkata">IST</option>
            <option value="Asia/Singapore">SGT</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="text-lg font-semibold text-slate-900">{p.monthTitle(p.currentMonth)}</p>
          <button
            type="button"
            onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {p.weekDays.map((w, i) => (
            <div key={`w-${i}`} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5">
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
                  "flex aspect-square max-h-14 items-center justify-center rounded-2xl text-sm font-semibold transition",
                  !inMonth ? "text-slate-300" : "",
                  canBook ? "bg-white text-slate-800 shadow-sm hover:bg-violet-50 hover:text-violet-800" : "",
                  !canBook && inMonth ? "cursor-not-allowed bg-white/40 text-slate-300" : "",
                  active ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300 hover:bg-violet-600 hover:text-white" : "",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-500">
          {p.selectedDate
            ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                p.selectedDate,
              )
            : "Choose a date above"}
        </p>
        {!p.selectedDate && <p className="text-sm text-slate-400">Times appear after you select a day.</p>}
        {p.selectedDate && p.availableTimes.length === 0 && (
          <p className="text-sm text-slate-400">Nothing free on this day.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {p.selectedDate &&
            p.availableTimes.map((slot) => (
              <div key={slot.iso} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => p.setSelectedTimeIso(slot.iso)}
                  className={[
                    "rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                    p.selectedTimeIso === slot.iso
                      ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50",
                  ].join(" ")}
                >
                  {slot.label}
                </button>
                {p.selectedTimeIso === slot.iso && (
                  <button
                    type="button"
                    onClick={p.onContinueToDetails}
                    className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Next
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

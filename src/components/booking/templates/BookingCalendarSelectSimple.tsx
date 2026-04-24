import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Original layout: month grid + right column time list. */
export function BookingCalendarSelectSimple(p: BookingCalendarSelectProps) {
  return (
    <>
      <h2 className="mb-8 text-5xl font-black tracking-tighter text-zinc-900 leading-none">Select a Slot</h2>
      <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="rounded-full p-2.5 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <AnimatePresence mode="wait">
              <motion.p 
                key={p.currentMonth.toISOString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-2xl font-black text-zinc-900 tracking-tight"
              >
                {p.monthTitle(p.currentMonth)}
              </motion.p>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="rounded-full p-2.5 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-90"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
            {p.weekDays.map((w, i) => (
              <div key={`w-${i}`} className="py-2">{w}</div>
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
                    "h-14 rounded-full text-sm font-bold transition-all relative group",
                    !inMonth ? "text-zinc-200" : "",
                    canBook && !active ? "text-zinc-900 hover:bg-zinc-900 hover:text-white" : "",
                    canBook && !inMonth ? "text-zinc-300" : "",
                    !canBook && inMonth ? "text-zinc-300" : "",
                    active ? "bg-zinc-900 text-white font-black shadow-xl shadow-zinc-200 ring-4 ring-zinc-50 scale-105" : "",
                  ].join(" ")}
                >
                  <span className="relative z-10">{date.getDate()}</span>
                  {canBook && !active && (
                    <span className="absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-zinc-300 group-hover:bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-100">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Time zone</p>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-100 px-5 py-3 text-sm text-zinc-600 bg-zinc-50/50 shadow-sm backdrop-blur-sm">
              <GlobeAltIcon className="h-4 w-4" />
              <select
                value={p.timezone}
                onChange={(e) => p.setTimezone(e.target.value)}
                className="bg-transparent font-bold text-zinc-800 outline-none cursor-pointer"
              >
                <option value="Asia/Kolkata">IST (GMT +5:30)</option>
                <option value="Asia/Singapore">SGT (GMT +8:00)</option>
                <option value="UTC">UTC (GMT +0:00)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:border-l lg:border-zinc-100 lg:pl-10">
          <p className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "Available Slots"}
          </p>
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {!p.selectedDate && <p className="text-sm font-bold text-zinc-300 italic">Select a date above.</p>}
            {p.selectedDate && p.availableTimes.length === 0 && (
              <p className="text-sm font-bold text-rose-400">No availability.</p>
            )}
            <AnimatePresence mode="popLayout">
              {p.selectedDate &&
                p.availableTimes.map((slot, idx) => (
                  <motion.div 
                    key={slot.iso} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="grid grid-cols-[1fr_auto] gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => p.setSelectedTimeIso(slot.iso)}
                      className={[
                        "rounded-2xl border px-4 py-3.5 text-sm font-black transition-all active:scale-95",
                        p.selectedTimeIso === slot.iso
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-200"
                          : "border-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {slot.label}
                    </button>
                    {p.selectedTimeIso === slot.iso && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        type="button"
                        onClick={p.onContinueToDetails}
                        className="rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-black text-white transition-all hover:bg-black shadow-lg"
                      >
                        Next
                      </motion.button>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

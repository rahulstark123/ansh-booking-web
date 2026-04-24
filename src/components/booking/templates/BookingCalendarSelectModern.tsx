import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Bento-style month cells + pill slot row. */
export function BookingCalendarSelectModern(p: BookingCalendarSelectProps) {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">Pick a slot</h2>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm text-slate-500 shadow-sm backdrop-blur-md">
          <GlobeAltIcon className="h-4 w-4" />
          <select
            value={p.timezone}
            onChange={(e) => p.setTimezone(e.target.value)}
            className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="Asia/Kolkata">IST (GMT +5:30)</option>
            <option value="Asia/Singapore">SGT (GMT +8:00)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-slate-50/30 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-90"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <AnimatePresence mode="wait">
            <motion.p 
              key={p.currentMonth.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl font-black text-slate-900 tracking-tight"
            >
              {p.monthTitle(p.currentMonth)}
            </motion.p>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-90"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {p.weekDays.map((w, i) => (
            <div key={`w-${i}`} className="py-2">
              {w}
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={p.currentMonth.toISOString()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 grid grid-cols-7 gap-2"
          >
            {p.calendarDays.map((date) => {
              const inMonth = date.getMonth() === p.currentMonth.getMonth();
              const canBook = inMonth && p.isDateBookable(date);
              const active = p.selectedDate ? p.sameDate(p.selectedDate, date) : false;
              return (
                <motion.button
                  key={date.toISOString()}
                  type="button"
                  whileHover={canBook ? { scale: 1.05, y: -2 } : {}}
                  whileTap={canBook ? { scale: 0.95 } : {}}
                  disabled={!canBook}
                  onClick={() => {
                    if (!canBook) return;
                    p.setSelectedDate(new Date(date));
                    p.setSelectedTimeIso(null);
                  }}
                  className={[
                    "flex aspect-square max-h-16 items-center justify-center rounded-[20px] text-sm font-black transition-all",
                    !inMonth ? "text-slate-200" : "",
                    canBook && !active ? "bg-white text-slate-800 shadow-sm border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600" : "",
                    !canBook && inMonth ? "cursor-not-allowed text-slate-300 opacity-40" : "",
                    active ? "bg-slate-900 text-white shadow-xl shadow-slate-200 border-slate-900 ring-4 ring-slate-100" : "",
                  ].join(" ")}
                >
                  {date.getDate()}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-4">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          {p.selectedDate
            ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                p.selectedDate,
              )
            : "Available Slots"}
        </p>
        {!p.selectedDate && <p className="text-sm font-bold text-slate-300 italic">Select a date to see available times.</p>}
        {p.selectedDate && p.availableTimes.length === 0 && (
          <p className="text-sm font-bold text-rose-400">No slots available for this day.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {p.selectedDate &&
              p.availableTimes.map((slot, idx) => (
                <motion.div 
                  key={slot.iso} 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => p.setSelectedTimeIso(slot.iso)}
                    className={[
                      "rounded-2xl border px-6 py-3.5 text-sm font-black transition-all active:scale-95",
                      p.selectedTimeIso === slot.iso
                        ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200"
                        : "border-slate-100 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 shadow-sm",
                    ].join(" ")}
                  >
                    {slot.label}
                  </button>
                  {p.selectedTimeIso === slot.iso && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={p.onContinueToDetails}
                      className="rounded-2xl bg-slate-900 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 hover:bg-black transition-all"
                    >
                      Confirm
                    </motion.button>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

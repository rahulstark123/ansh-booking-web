import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Dense single-column flow: small grid + full-width slot stack. */
export function BookingCalendarSelectCompact(p: BookingCalendarSelectProps) {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Select Slot</h2>

      <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-2 shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-900 transition-all active:scale-90"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <AnimatePresence mode="wait">
          <motion.span 
            key={p.currentMonth.toISOString()}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs font-black uppercase tracking-widest text-zinc-900"
          >
            {p.monthTitle(p.currentMonth)}
          </motion.span>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-900 transition-all active:scale-90"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300">
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
            <motion.button
              key={date.toISOString()}
              type="button"
              whileTap={canBook ? { scale: 0.9 } : {}}
              disabled={!canBook}
              onClick={() => {
                if (!canBook) return;
                p.setSelectedDate(new Date(date));
                p.setSelectedTimeIso(null);
              }}
              className={[
                "h-10 rounded-xl text-xs font-bold transition-all",
                !inMonth ? "text-zinc-100" : "",
                canBook && !active ? "text-zinc-900 hover:bg-zinc-100" : "",
                !canBook && inMonth ? "text-zinc-200" : "",
                active ? "bg-zinc-900 text-white shadow-lg shadow-zinc-100 ring-2 ring-zinc-50" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/30 px-3 py-2 text-[10px] font-bold text-zinc-400">
        <GlobeAltIcon className="h-4 w-4" />
        <select
          value={p.timezone}
          onChange={(e) => p.setTimezone(e.target.value)}
          className="flex-1 bg-transparent text-zinc-900 outline-none cursor-pointer"
        >
          <option value="Asia/Kolkata">IST (GMT +5:30)</option>
          <option value="Asia/Singapore">SGT (GMT +8:00)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div className="border-t border-zinc-100 pt-6">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Slots</p>
        {!p.selectedDate && <p className="text-xs font-bold text-zinc-200 italic">Select a day.</p>}
        {p.selectedDate && p.availableTimes.length === 0 && (
          <p className="text-xs font-bold text-rose-300 italic">No slots available.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {p.selectedDate &&
              p.availableTimes.map((slot, idx) => (
                <motion.button
                  key={slot.iso}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  type="button"
                  onClick={() => p.setSelectedTimeIso(slot.iso)}
                  className={[
                    "rounded-xl border px-3 py-3 text-center text-xs font-black transition-all active:scale-95",
                    p.selectedTimeIso === slot.iso
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-100"
                      : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {slot.label}
                </motion.button>
              ))}
          </AnimatePresence>
        </div>
        {p.selectedTimeIso && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            type="button"
            onClick={p.onContinueToDetails}
            className="mt-4 w-full rounded-xl bg-zinc-900 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl shadow-zinc-200 hover:bg-black transition-all active:scale-95"
          >
            Confirm
          </motion.button>
        )}
      </div>
    </div>
  );
}

import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Magazine layout: large type + narrow calendar band + wide time grid. */
export function BookingCalendarSelectEditorial(p: BookingCalendarSelectProps) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1.2fr_minmax(300px,380px)] lg:gap-20">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Scheduling System</p>
        <h2 className="mt-6 font-serif text-6xl font-black leading-[0.95] tracking-tighter text-zinc-900 md:text-7xl lg:text-8xl">
          Pick your
          <br />
          <span className="italic">moment.</span>
        </h2>
        <p className="mt-8 max-w-sm text-base leading-relaxed text-zinc-500 font-medium">
          Choose a date from the editorial grid, then select an available slot to proceed with your booking.
        </p>
        <div className="mt-12 inline-flex items-center gap-4 border-b-2 border-zinc-900 pb-2 text-sm text-zinc-900 group cursor-pointer">
          <GlobeAltIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
          <select
            value={p.timezone}
            onChange={(e) => p.setTimezone(e.target.value)}
            className="bg-transparent font-black text-sm outline-none cursor-pointer"
          >
            <option value="Asia/Kolkata">IST (GMT +5:30)</option>
            <option value="Asia/Singapore">SGT (GMT +8:00)</option>
            <option value="UTC">UTC (GMT +0:00)</option>
          </select>
        </div>
      </div>

      <div className="space-y-12 border-t-4 border-zinc-900 pt-12 lg:border-t-0 lg:border-l lg:pl-16 lg:pt-0">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <AnimatePresence mode="wait">
              <motion.p 
                key={p.currentMonth.toISOString()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="font-serif text-2xl font-black text-zinc-900"
              >
                {p.monthTitle(p.currentMonth)}
              </motion.p>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors active:scale-90"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px border border-zinc-900 bg-zinc-900">
            {p.weekDays.map((w, i) => (
              <div key={`w-${i}`} className="bg-zinc-50 py-3 text-center text-[9px] font-black uppercase tracking-widest text-zinc-400">
                {w.slice(0, 1)}
              </div>
            ))}
            <AnimatePresence mode="wait">
              <motion.div 
                key={p.currentMonth.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="contents"
              >
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
                        "aspect-square min-h-[2.5rem] text-sm font-black transition-all",
                        "bg-white",
                        !inMonth ? "text-zinc-100" : "",
                        canBook && !active ? "text-zinc-900 hover:bg-zinc-50" : "",
                        !canBook && inMonth ? "text-zinc-200" : "",
                        active ? "bg-zinc-900 text-white shadow-2xl scale-[1.02] z-10" : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div>
          <p className="font-serif text-3xl font-black text-zinc-900 italic tracking-tighter">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "No date selected"}
          </p>
          {!p.selectedDate && <p className="mt-4 text-sm font-medium text-zinc-300 italic">Select a date from the grid above.</p>}
          {p.selectedDate && p.availableTimes.length === 0 && (
            <p className="mt-4 text-sm font-black text-rose-400">No availability for this day.</p>
          )}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {p.selectedDate &&
                p.availableTimes.map((slot, idx) => (
                  <motion.button
                    key={slot.iso}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    type="button"
                    onClick={() => p.setSelectedTimeIso(slot.iso)}
                    className={[
                      "border-2 px-4 py-4 text-center text-sm font-black transition-all active:scale-95",
                      p.selectedTimeIso === slot.iso
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xl"
                        : "border-zinc-100 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900",
                    ].join(" ")}
                  >
                    {slot.label}
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
          {p.selectedTimeIso && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={p.onContinueToDetails}
              className="mt-8 w-full bg-zinc-900 py-5 text-xs font-black uppercase tracking-[0.3em] text-white hover:bg-black transition-all shadow-2xl active:scale-[0.98]"
            >
              Confirm Appointment
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

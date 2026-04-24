import { ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import type { BookingCalendarSelectProps } from "./calendar-select-types";

/** Ledger-style bordered grid + serif + warm paper. */
export function BookingCalendarSelectVintage(p: BookingCalendarSelectProps) {
  return (
    <div className="space-y-10">
      <div className="border-b-4 border-amber-900/10 pb-6">
        <p className="font-serif text-[10px] font-bold uppercase tracking-[0.4em] text-amber-900/40">Log Appointment</p>
        <h2 className="mt-3 font-serif text-5xl font-medium text-amber-950 tracking-tighter italic">Choose day & hour</h2>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_minmax(240px,320px)]">
        <div>
          <div className="mb-6 flex items-center justify-between border-b-2 border-amber-900/5 pb-4">
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() - 1, 1))}
              className="border border-amber-900/20 p-2 text-amber-950 hover:bg-amber-100/60 transition-colors active:scale-90"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <AnimatePresence mode="wait">
              <motion.p 
                key={p.currentMonth.toISOString()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="font-serif text-2xl font-semibold text-amber-950 tracking-tight"
              >
                {p.monthTitle(p.currentMonth)}
              </motion.p>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => p.setCurrentMonth(new Date(p.currentMonth.getFullYear(), p.currentMonth.getMonth() + 1, 1))}
              className="border border-amber-900/20 p-2 text-amber-950 hover:bg-amber-100/60 transition-colors active:scale-90"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-hidden border-[3px] border-amber-900/10 bg-amber-900/5 p-1.5 shadow-inner">
            <div className="grid grid-cols-7 gap-1 bg-amber-900/10">
              {p.weekDays.map((w, i) => (
                <div
                  key={`w-${i}`}
                  className="bg-[#f0e6d4]/80 py-3 text-center font-serif text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900/60"
                >
                  {w}
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
                          "min-h-[3.5rem] font-serif text-base transition-all",
                          "bg-[#faf6ef]/90",
                          !inMonth ? "text-amber-900/10" : "",
                          canBook && !active ? "text-amber-950 hover:bg-amber-100/80 hover:scale-[0.98]" : "",
                          canBook && active ? "text-amber-950" : "",
                          !canBook && inMonth ? "text-amber-800/20" : "",
                          active ? "z-[1] bg-amber-100 font-black shadow-[inset_0_0_0_3px_rgba(120,53,15,0.2)]" : "",
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

          <div className="mt-8 flex items-center gap-3 border-b-2 border-amber-900/10 bg-transparent px-2 py-4 font-serif text-sm text-amber-950">
            <GlobeAltIcon className="h-5 w-5 shrink-0 text-amber-900/30" />
            <select
              value={p.timezone}
              onChange={(e) => p.setTimezone(e.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none italic font-medium cursor-pointer"
            >
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Singapore">Singapore Time (SGT)</option>
              <option value="UTC">Universal Time (UTC)</option>
            </select>
          </div>
        </div>

        <div className="lg:border-l-2 lg:border-amber-900/10 lg:pl-12">
          <p className="font-serif text-xl font-semibold text-amber-950 italic tracking-tight">
            {p.selectedDate
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(
                  p.selectedDate,
                )
              : "Register Entry"}
          </p>
          <p className="mt-2 font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-amber-900/30">Available Slots</p>
          <ul className="mt-6 max-h-[30rem] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {!p.selectedDate && <li className="font-serif text-sm text-amber-800/40 italic">Select a ledger date.</li>}
            {p.selectedDate && p.availableTimes.length === 0 && (
              <li className="font-serif text-sm text-amber-800/40 italic">No availability found.</li>
            )}
            <AnimatePresence mode="popLayout">
              {p.selectedDate &&
                p.availableTimes.map((slot, idx) => (
                  <motion.li 
                    key={slot.iso} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => p.setSelectedTimeIso(slot.iso)}
                      className={[
                        "min-w-[7rem] border-2 px-4 py-3 font-serif text-base font-bold transition-all active:scale-95",
                        p.selectedTimeIso === slot.iso
                          ? "border-amber-900 bg-amber-900 text-[#faf6ef] shadow-lg shadow-amber-900/10"
                          : "border-amber-900/10 text-amber-950 hover:border-amber-900/30 hover:bg-amber-50/50",
                      ].join(" ")}
                    >
                      {slot.label}
                    </button>
                    {p.selectedTimeIso === slot.iso && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        type="button"
                        onClick={p.onContinueToDetails}
                        className="border-2 border-amber-900/20 bg-amber-50 px-5 py-3 font-serif text-base font-black italic text-amber-950 hover:bg-amber-100 transition-colors"
                      >
                        Confirm Slot
                      </motion.button>
                    )}
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  );
}

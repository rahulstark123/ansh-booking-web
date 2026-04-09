const WEEK_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

/** Matches original hero mockup grid (October view). */
const CALENDAR_ROWS: number[][] = [
  [29, 30, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, 1, 2],
];

function IconCalendarSmall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconUserCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 18c0-2.21 2.24-4 4-4s4 1.79 4 4M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getDayCellClass(day: number, rowIndex: number): string {
  const mutedPrev = rowIndex === 0 && (day === 29 || day === 30);
  const mutedNext = rowIndex === 4 && (day === 1 || day === 2);
  const isSelected = day === 3;
  const isSoft = day === 9 || day === 17;

  if (mutedPrev || mutedNext) {
    return "flex h-11 w-11 items-center justify-center text-base font-medium text-[#d3d8e8]";
  }
  if (isSelected) {
    return "relative flex h-11 w-11 items-center justify-center rounded-full bg-[#2a38ff] text-base font-semibold text-white shadow-[0_6px_16px_rgba(42,56,255,0.35)]";
  }
  if (isSoft) {
    return "flex h-11 w-11 items-center justify-center rounded-full bg-[#eef1ff] text-base font-semibold text-[#2a38ff]";
  }
  return "flex h-11 w-11 items-center justify-center text-base font-medium text-[#243051]";
}

export function BookingCalendarMockup() {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-[1.75rem] border border-[#e9edff] bg-white shadow-[0_30px_60px_rgba(7,24,79,0.1)] transition-shadow duration-500 hover:shadow-[0_36px_72px_rgba(7,24,79,0.14)]">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Available slots */}
        <div className="border-b border-[#edf1ff] bg-[#f4f7ff] p-6 md:border-r md:border-b-0 md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCalendarSmall className="h-4 w-4 text-[#2a38ff]" />
              <p className="text-[11px] font-bold tracking-[0.22em] text-[#2a38ff] uppercase">
                Available Slots
              </p>
            </div>
            <span className="text-lg font-light text-[#8b96b9]">+</span>
          </div>

          <div className="space-y-3">
            <article className="relative overflow-hidden rounded-2xl bg-white py-3.5 pr-4 pl-5 shadow-[0_10px_24px_rgba(7,24,79,0.08)]">
              <span className="absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl bg-[#2a38ff]" aria-hidden />
              <p className="text-sm font-bold text-[#0b1a3f]">10:00 AM</p>
              <p className="mt-1 text-xs text-[#6c7794]">General Consulting</p>
            </article>
            <article className="relative overflow-hidden rounded-2xl bg-white py-3.5 pr-4 pl-5 shadow-[0_10px_24px_rgba(7,24,79,0.08)]">
              <span className="absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl bg-[#e2772f]" aria-hidden />
              <p className="text-sm font-bold text-[#0b1a3f]">11:30 AM</p>
              <p className="mt-1 text-xs text-[#6c7794]">Premium Design Review</p>
            </article>
            <article className="rounded-2xl border border-dashed border-[#d6ddfb] bg-[#f6f8ff] px-4 py-5 text-center text-xs font-medium text-[#8b95b3]">
              No more slots for today
            </article>
          </div>

          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#2a38ff] py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(42,56,255,0.25)]"
          >
            <span className="text-lg leading-none">+</span>
            New Appointment
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight text-[#111f45]">October 2024</p>
            <div className="flex items-center gap-1 text-[#a1a8c2]">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e4e8f8] text-sm hover:bg-[#f8f9ff]"
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e4e8f8] text-sm hover:bg-[#f8f9ff]"
                aria-label="Next month"
              >
                ›
              </button>
              <IconSearch className="ml-2 h-5 w-5" />
              <IconUserCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 gap-y-1 text-center">
            {WEEK_DAYS.map((d, i) => (
              <p
                key={d}
                className={`pb-3 text-[11px] font-bold tracking-wide ${
                  i >= 5 ? "text-[#e2772f]" : "text-[#97a0bf]"
                }`}
              >
                {d}
              </p>
            ))}

            {CALENDAR_ROWS.map((row, rowIndex) =>
              row.map((day, colIndex) => {
                const isSelected = day === 3;
                const cellClass = getDayCellClass(day, rowIndex);
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="flex min-h-[2.75rem] items-start justify-center pt-0.5"
                  >
                    {isSelected ? (
                      <span className={cellClass}>
                        <span className="absolute -top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#e2772f]" />
                        {day}
                      </span>
                    ) : (
                      <span className={cellClass}>{day}</span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

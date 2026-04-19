"use client";

import { type BookingPageThemeId, normalizeBookingPageTemplate } from "@/lib/booking-page-templates";

/** Tiny static mock of each **layout** template for the scheduling drawer. */
export function BookingPageThemePreview({ themeId }: { themeId: BookingPageThemeId }) {
  const id = normalizeBookingPageTemplate(themeId);

  if (id === "vintage") {
    return (
      <div className="overflow-hidden rounded-sm border-2 border-amber-900/30 bg-[#faf6ef] p-1 font-serif text-amber-950 shadow-sm">
        <div className="grid grid-cols-7 gap-px bg-amber-900/30">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="bg-[#f0e6d4] py-1 text-center text-[6px] font-bold">
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </div>
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={`c-${i}`}
              className={[
                "flex min-h-[14px] items-center justify-center bg-[#faf6ef] text-[7px]",
                i === 5 ? "font-semibold shadow-[inset_0_0_0_1px_rgba(120,53,15,0.5)]" : "",
              ].join(" ")}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "modern") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <div className="mb-1 flex justify-between text-[7px] font-semibold text-slate-600">
          <span>‹</span>
          <span>April</span>
          <span>›</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className={[
                "flex aspect-square max-h-[18px] items-center justify-center rounded-lg text-[6px] font-semibold",
                i === 8 ? "bg-violet-600 text-white" : "bg-white text-slate-700 shadow-sm",
              ].join(" ")}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[6px]">9:00</span>
          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[6px] text-white">9:30</span>
        </div>
      </div>
    );
  }

  if (id === "compact") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-2">
        <div className="mb-1 text-center text-[7px] font-semibold text-zinc-800">April 2026</div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className={[
                "flex h-4 items-center justify-center rounded text-[6px]",
                i === 6 ? "bg-blue-600 text-white" : "text-zinc-600",
              ].join(" ")}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <div className="rounded border border-zinc-200 py-1 text-center text-[6px]">9:00</div>
          <div className="rounded border border-blue-700 bg-blue-700 py-1 text-center text-[6px] text-white">9:30</div>
        </div>
      </div>
    );
  }

  if (id === "editorial") {
    return (
      <div className="border border-zinc-900 bg-white p-2">
        <p className="font-serif text-[10px] font-light leading-none text-zinc-900">Select</p>
        <div className="mt-2 grid grid-cols-7 gap-px bg-zinc-900">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="bg-zinc-100 py-0.5 text-center text-[5px] font-bold text-zinc-500">
              {["M", "T", "W", "T", "F", "S", "S"][i]}
            </div>
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={`e-${i}`}
              className={[
                "flex min-h-[12px] items-center justify-center bg-white text-[6px]",
                i === 4 ? "bg-zinc-900 text-white" : "text-zinc-800",
              ].join(" ")}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // simple (default)
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid min-h-[88px] grid-cols-[38%_1fr]">
        <div className="border-r border-zinc-200 p-2">
          <p className="text-[8px] font-medium text-zinc-700">Host</p>
          <p className="mt-0.5 line-clamp-2 text-[9px] font-bold text-zinc-900">Event</p>
        </div>
        <div className="p-2">
          <div className="mb-1 grid grid-cols-7 gap-px text-center text-[5px] font-semibold text-zinc-500">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={`hdr-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                className={[
                  "flex h-[14px] items-center justify-center rounded-full text-[6px]",
                  i === 5 ? "bg-blue-100 font-semibold text-blue-800 ring-1 ring-blue-300" : "text-zinc-600",
                ].join(" ")}
              >
                {10 + i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

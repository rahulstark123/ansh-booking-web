"use client";

import { CalendarDaysIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Make your work easier and organized with ANSH Bookings",
    subtitle: "Calendar-first scheduling for modern teams",
    meetings: ["10:00 AM • Product demo", "12:30 PM • Team round robin", "03:00 PM • Client onboarding"],
    count: "4 meetings",
  },
  {
    title: "Coordinate your team in one shared booking flow",
    subtitle: "Round robin, host rotation, and smooth handoffs",
    meetings: ["09:30 AM • Sales intro", "01:00 PM • Onboarding call", "05:00 PM • Weekly check-in"],
    count: "3 meetings",
  },
  {
    title: "Stay focused while ANSH handles booking logistics",
    subtitle: "Automated reminders, cleaner calendar, fewer no-shows",
    meetings: ["11:00 AM • Demo follow-up", "02:15 PM • Strategy sync", "06:00 PM • Support review"],
    count: "3 meetings",
  },
];

export function LoginShowcaseCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const slide = SLIDES[active];

  return (
    <div className="relative flex h-full flex-col justify-center bg-[#f6faf4] p-8 xl:p-10">
      <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-[var(--app-primary-soft)] blur-3xl" />
      <div className="absolute bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-100 blur-3xl" />

      <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white/85 p-6 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-5 w-5 text-[var(--app-primary)]" />
            <p className="text-sm font-semibold text-zinc-900">Today&apos;s Calendar</p>
          </div>
          <span className="rounded-full bg-[var(--app-primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--app-primary-soft-text)]">
            {slide.count}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-500">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={`${d}-${i}`} className="py-1">
              {d}
            </span>
          ))}
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className={[
                "rounded-md py-1 text-xs",
                i === 9 || i === 12 ? "bg-[var(--app-primary)] text-white" : "text-zinc-700",
              ].join(" ")}
            >
              {i + 1}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          {slide.meetings.map((item) => (
            <div key={item} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {item}
            </div>
          ))}
        </div>
      </div>

      <p className="relative mx-auto mt-8 max-w-2xl text-center text-4xl leading-tight font-semibold tracking-tight text-zinc-900">
        {slide.title}
      </p>
      <p className="mt-3 flex items-center justify-center gap-1 text-sm text-zinc-600">
        <SparklesIcon className="h-4 w-4 text-[var(--app-primary)]" />
        {slide.subtitle}
      </p>

      <div className="mt-5 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={[
              "h-1.5 rounded-full transition",
              active === i ? "w-6 bg-[var(--app-primary)]" : "w-3 bg-zinc-300 hover:bg-zinc-400",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

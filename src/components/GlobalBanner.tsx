"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function GlobalBanner() {
  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-2xl bg-[#081430] py-3 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      <div className="relative flex items-center justify-center gap-3 px-6">
        <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-zinc-300">
          Website is in <span className="text-white">Building phase</span> — some features may not work as expected
        </p>
      </div>
    </div>
  );
}

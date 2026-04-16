"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type NavKey = "features" | "pricing" | "who";

/** Page order top → bottom; last match below the scan line wins */
const SECTIONS: { id: string; key: NavKey }[] = [
  { id: "features", key: "features" },
  { id: "who-can-book", key: "who" },
  { id: "pricing", key: "pricing" },
];

function navLinkClass(active: boolean) {
  return [
    "inline-block border-b-2 pb-0.5",
    active
      ? "border-[#2a38ff] font-semibold text-[#2a38ff]"
      : "border-transparent font-medium text-[#23314f] transition-colors hover:text-[#0f172a]",
  ].join(" ");
}

export function SiteHeader() {
  const [active, setActive] = useState<NavKey | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const updateActive = useCallback(() => {
    const pill = pillRef.current;
    if (typeof window === "undefined") return;

    // Viewport Y of the “reading line”: below the pill and at/ below hash scroll landings
    // (html scroll-padding-top), or #pricing’s top stays above the line and WHO stays active.
    const pillBottom = pill?.getBoundingClientRect().bottom ?? 88;
    const padRaw = getComputedStyle(document.documentElement).scrollPaddingTop;
    const scrollPad = parseFloat(padRaw) || 0;
    const scanY = Math.max(pillBottom + 16, scrollPad + 12);

    let current: NavKey | null = null;
    for (const { id, key } of SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= scanY) current = key;
    }
    setActive((prev) => (prev === current ? prev : current));
  }, []);

  useLayoutEffect(() => {
    updateActive();
  }, [updateActive]);

  useEffect(() => {
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    window.addEventListener("hashchange", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
      window.removeEventListener("hashchange", updateActive);
    };
  }, [updateActive]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full bg-transparent px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-6 sm:pt-[max(1.25rem,env(safe-area-inset-top,0px))] md:pt-[max(1.5rem,env(safe-area-inset-top,0px))]">
      <div
        ref={pillRef}
        className="pointer-events-auto mx-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-full border border-white/70 bg-white/80 py-2.5 pr-2 pl-4 shadow-[0_10px_40px_rgba(7,24,79,0.08)] backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,background-color] duration-300 sm:gap-5 sm:py-3 sm:pl-5 sm:pr-2.5 supports-[backdrop-filter]:bg-white/65 lg:max-w-5xl lg:gap-8 lg:pl-7 lg:pr-3"
      >
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-baseline gap-1.5 text-base font-extrabold tracking-wide sm:text-lg"
        >
          <span className="text-[#2a38ff]">ANSH</span>
          <span className="font-bold text-[#94a3b8]" aria-hidden>
            ·
          </span>
          <span className="font-semibold text-[#0f172a]">Bookings</span>
        </Link>
        <nav className="hidden min-w-0 items-center gap-5 text-sm md:flex md:gap-6" aria-label="Primary">
          <a
            href="#features"
            className={navLinkClass(active === "features")}
            aria-current={active === "features" ? "page" : undefined}
          >
            Products
          </a>
          <a
            href="#who-can-book"
            className={navLinkClass(active === "who")}
            aria-label="Who can book"
            aria-current={active === "who" ? "page" : undefined}
          >
            WHO ?
          </a>
          <a
            href="#pricing"
            className={navLinkClass(active === "pricing")}
            aria-current={active === "pricing" ? "page" : undefined}
          >
            Pricing
          </a>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 sm:gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#243051] transition-colors hover:bg-black/5 sm:px-4"
          >
            Login
          </Link>
          <button
            type="button"
            className="rounded-full bg-[#2a38ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(42,56,255,0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] sm:px-5"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

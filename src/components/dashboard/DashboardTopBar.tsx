"use client";

import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/stores/auth-store";

export function DashboardTopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const planTag =
    user && (user.role.toLowerCase().includes("pro") || user.role.toLowerCase().includes("premium"))
      ? "PRO"
      : "FREE";

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center gap-4 border-b border-zinc-200/80 bg-white/95 px-5 py-3 backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-2xl flex-1">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <label htmlFor="dash-search" className="sr-only">
          Search appointments and clients
        </label>
        <input
          id="dash-search"
          type="search"
          placeholder="Search appointments, clients…"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pr-3 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-[var(--app-focus-border)] focus:bg-white focus:ring-2 focus:ring-[var(--app-ring)]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span
          className={[
            "mr-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
            planTag === "PRO"
              ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
              : "bg-zinc-100 text-zinc-700",
          ].join(" ")}
        >
          {planTag}
        </span>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Notifications"
        >
          <BellIcon className="h-[17px] w-[17px]" aria-hidden />
        </button>
      </div>

      {user && (
        <div className="flex shrink-0 items-center gap-3 border-l border-zinc-200 pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.role}</p>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] text-xs font-semibold text-[var(--app-primary-foreground)] shadow-sm"
            aria-hidden
          >
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
            aria-label="Sign out"
          >
            <ArrowRightStartOnRectangleIcon className="h-[17px] w-[17px]" aria-hidden />
          </button>
        </div>
      )}
    </header>
  );
}

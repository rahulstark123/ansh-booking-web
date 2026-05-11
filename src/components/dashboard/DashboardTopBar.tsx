"use client";

import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function DashboardTopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const planTag = user?.plan ?? "FREE";

  async function handleLogout() {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);

    // Wait for the animation to play
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const client = await getSupabaseBrowserClient();
      if (client) await client.auth.signOut();
    } finally {
      clearUser();
      router.push("/login");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex shrink-0 items-center gap-4 border-b border-zinc-200/80 bg-[color:var(--background)]/95 px-5 py-3 backdrop-blur">
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
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-[var(--app-row-hover)] hover:text-zinc-800"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--app-gradient-from)] to-[var(--app-gradient-to)] text-xs font-semibold text-[var(--app-primary-foreground)] shadow-sm overflow-hidden"
            aria-hidden
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 transition hover:bg-[var(--app-row-hover)] hover:text-rose-500"
            aria-label="Sign out"
          >
            <ArrowRightStartOnRectangleIcon className="h-[17px] w-[17px]" aria-hidden />
          </button>
        </div>
      )}
    </header>

    <ConfirmDialog
      open={showLogoutConfirm}
      title="Ready to leave?"
      message="Are you sure you want to logout? You will need to sign in again to access your dashboard."
      confirmLabel="Logout"
      tone="danger"
      onConfirm={handleLogout}
      onCancel={() => setShowLogoutConfirm(false)}
    />

    <AnimatePresence>
      {isLoggingOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--app-primary-soft)] text-4xl">
              👋
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">
              See you soon, <span className="text-[var(--app-primary)]">{user?.name.split(" ")[0]}!</span>
            </h2>
            <p className="mt-4 font-bold text-zinc-500">Signing you out securely...</p>
            
            <div className="mt-10 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="h-2 w-2 rounded-full bg-[var(--app-primary)]"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
}

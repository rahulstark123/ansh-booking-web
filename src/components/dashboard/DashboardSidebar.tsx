"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  IdentificationIcon,
  LifebuoyIcon,
  LinkIcon,
  PaintBrushIcon,
  PlusIcon,
  PuzzlePieceIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

import { AppearanceModal } from "@/components/dashboard/AppearanceModal";
import { NewBookingEventTypeDialog } from "@/components/dashboard/NewBookingEventTypeDialog";
import { useDashboardUiStore } from "@/stores/dashboard-ui-store";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { href: "/dashboard/scheduling", label: "Scheduling", icon: LinkIcon },
  { href: "/dashboard/meetings", label: "Meetings", icon: CalendarIcon },
  { href: "/dashboard/availability", label: "Availability", icon: ClockIcon },
  { href: "/dashboard/contacts", label: "Contacts", icon: IdentificationIcon },
  { href: "/dashboard/integrations", label: "Integrations & apps", icon: PuzzlePieceIcon },
] as const;

const SETTINGS_HREF = "/dashboard/settings" as const;
const BILLING_HREF = "/dashboard/billing" as const;
const SUPPORT_HREF = "/dashboard/support" as const;

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const newBookingButtonRef = useRef<HTMLButtonElement>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const collapsed = useDashboardUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDashboardUiStore((s) => s.toggleSidebar);
  const openNewBookingModal = useDashboardUiStore((s) => s.openNewBookingModal);
  const setSidebarCollapsed = useDashboardUiStore((s) => s.setSidebarCollapsed);
  const billingActive = navActive(pathname, BILLING_HREF);
  const settingsActive = navActive(pathname, SETTINGS_HREF);
  const supportActive = navActive(pathname, SUPPORT_HREF);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1000) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white/80 backdrop-blur-xl shadow-[1px_0_0_rgba(0,0,0,0.02)]"
      >
        {/* Header / Logo */}
        <div className="flex h-20 items-center px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 overflow-hidden rounded-xl p-1.5 transition-all hover:bg-zinc-50 active:scale-95"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-zinc-200/50 dark:shadow-none ring-1 ring-zinc-800">
              <Squares2X2Icon className="h-5 w-5" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="whitespace-nowrap"
                >
                  <span className="block text-sm font-bold tracking-tight text-zinc-900">ANSH Bookings</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pro Workspace</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>



        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-none">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={[
                  "group relative flex items-center rounded-xl text-sm font-semibold transition-all",
                  collapsed ? "h-12 justify-center" : "h-12 gap-3 px-3",
                  active
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                ].join(" ")}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Icon
                  className={[
                    "relative z-10 h-5 w-5 shrink-0 transition-colors",
                    active ? "text-[var(--app-primary)]" : "text-zinc-400 group-hover:text-zinc-600",
                  ].join(" ")}
                />
                
                {!collapsed && (
                  <span className="relative z-10 whitespace-nowrap">{label}</span>
                )}
                
                {active && !collapsed && (
                  <div className="absolute left-[-12px] h-6 w-1 rounded-r-full bg-[var(--app-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="space-y-1 border-t border-zinc-100 p-3">
          <Link
            href={BILLING_HREF}
            className={[
              "group relative flex h-12 items-center rounded-xl text-sm font-semibold transition-all",
              collapsed ? "justify-center" : "gap-3 px-3",
              billingActive
                ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            {billingActive && (
              <motion.div
                layoutId="sidebar-active-footer"
                className="absolute inset-0 rounded-xl border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] shadow-sm"
              />
            )}
            <CreditCardIcon className={["relative z-10 h-5 w-5", billingActive ? "text-[var(--app-primary)]" : "text-zinc-400"].join(" ")} />
            {!collapsed && <span className="relative z-10">Billing</span>}
          </Link>

          <Link
            href={SETTINGS_HREF}
            className={[
              "group relative flex h-12 items-center rounded-xl text-sm font-semibold transition-all",
              collapsed ? "justify-center" : "gap-3 px-3",
              settingsActive
                ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            {settingsActive && (
              <motion.div
                layoutId="sidebar-active-footer"
                className="absolute inset-0 rounded-xl border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] shadow-sm"
              />
            )}
            <Cog6ToothIcon className={["relative z-10 h-5 w-5", settingsActive ? "text-[var(--app-primary)]" : "text-zinc-400"].join(" ")} />
            {!collapsed && <span className="relative z-10">Settings</span>}
          </Link>

          <Link
            href={SUPPORT_HREF}
            className={[
              "group relative flex h-12 items-center rounded-xl text-sm font-semibold transition-all",
              collapsed ? "justify-center" : "gap-3 px-3",
              supportActive
                ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            {supportActive && (
              <motion.div
                layoutId="sidebar-active-footer"
                className="absolute inset-0 rounded-xl border border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] shadow-sm"
              />
            )}
            <LifebuoyIcon className={["relative z-10 h-5 w-5", supportActive ? "text-[var(--app-primary)]" : "text-zinc-400"].join(" ")} />
            {!collapsed && <span className="relative z-10">Support</span>}
          </Link>

          <button
            type="button"
            onClick={() => setAppearanceOpen(true)}
            className={[
              "group flex h-12 w-full items-center rounded-xl text-sm font-semibold text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-900",
              collapsed ? "justify-center" : "gap-3 px-3",
            ].join(" ")}
          >
            <PaintBrushIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600" />
            {!collapsed && <span>Appearance</span>}
          </button>

          {/* Toggle Sidebar Button */}
          <div className="hidden min-[1000px]:block">
            <button
              type="button"
              onClick={toggleSidebar}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.aside>
      <AppearanceModal open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </>
  );
}

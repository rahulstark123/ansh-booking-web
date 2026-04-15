"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  IdentificationIcon,
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
  const settingsActive = navActive(pathname, SETTINGS_HREF);

  return (
    <>
      <aside
        className={[
          "sticky top-0 flex min-h-0 h-[100dvh] shrink-0 flex-col border-r border-zinc-200/80 bg-white py-5 shadow-[1px_0_0_rgba(0,0,0,0.03)] transition-[width] duration-200 ease-out",
          collapsed ? "w-[72px] px-2" : "w-[260px] px-3",
        ].join(" ")}
      >
        <div className={["mb-4 flex items-center gap-2", collapsed ? "flex-col px-0" : "justify-between px-1"].join(" ")}>
          <Link
            href="/dashboard"
            className={[
              "flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:bg-[var(--app-row-hover)]",
              collapsed ? "justify-center p-2" : "flex-1 px-2 py-1.5",
            ].join(" ")}
            title="ANSH Bookings"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-primary)] text-[var(--app-primary-foreground)] shadow-sm">
              <Squares2X2Icon className="h-[17px] w-[17px]" aria-hidden />
            </span>
            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-zinc-900">ANSH Bookings</span>
                <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">Workspace</span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-[var(--app-row-hover)] hover:text-zinc-700"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
            )}
          </button>
        </div>

        <div className={["relative mb-5", collapsed ? "flex justify-center" : ""].join(" ")}>
          <button
            ref={newBookingButtonRef}
            type="button"
            onClick={openNewBookingModal}
            title={collapsed ? "New booking" : undefined}
            className={[
              "flex items-center justify-center rounded-lg bg-[var(--app-primary)] text-sm font-medium text-[var(--app-primary-foreground)] shadow-sm transition hover:bg-[var(--app-primary-hover)]",
              collapsed ? "h-10 w-10 p-0" : "w-full gap-2 py-2.5",
            ].join(" ")}
            aria-label="New booking"
            aria-haspopup="menu"
          >
            <PlusIcon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span>New booking</span>}
          </button>
          <NewBookingEventTypeDialog anchorRef={newBookingButtonRef} collapsed={collapsed} />
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden" aria-label="Dashboard">
          {NAV_MAIN.map(({ href, label, icon: Icon }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={[
                  "flex items-center rounded-lg text-[13px] font-medium transition-colors",
                  collapsed ? "justify-center px-2 py-2.5" : "gap-3 py-2.5 pr-3 pl-2.5",
                  active
                    ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                    : "text-zinc-600 hover:bg-[var(--app-row-hover)] hover:text-zinc-900",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-[17px] w-[17px] shrink-0",
                    active ? "text-[var(--app-primary-muted-icon)]" : "text-zinc-400",
                  ].join(" ")}
                  aria-hidden
                />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 border-t border-zinc-200 pt-3">
          <Link
            href={SETTINGS_HREF}
            title={collapsed ? "Settings" : undefined}
            className={[
              "flex items-center rounded-lg text-[13px] font-medium transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 py-2.5 pr-3 pl-2.5",
              settingsActive
                ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                : "text-zinc-600 hover:bg-[var(--app-row-hover)] hover:text-zinc-900",
            ].join(" ")}
          >
            <Cog6ToothIcon
              className={[
                "h-[17px] w-[17px] shrink-0",
                settingsActive ? "text-[var(--app-primary-muted-icon)]" : "text-zinc-400",
              ].join(" ")}
              aria-hidden
            />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            type="button"
            onClick={() => setAppearanceOpen(true)}
            title={collapsed ? "Appearance" : undefined}
            className={[
              "mt-2 flex w-full items-center rounded-lg text-[13px] font-medium transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 py-2.5 pr-3 pl-2.5",
              "text-zinc-600 hover:bg-[var(--app-row-hover)] hover:text-zinc-900",
            ].join(" ")}
          >
            <PaintBrushIcon className="h-[17px] w-[17px] shrink-0 text-zinc-400" aria-hidden />
            {!collapsed && <span>Appearance</span>}
          </button>
        </div>
      </aside>
      <AppearanceModal open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </>
  );
}

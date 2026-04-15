"use client";

import type { ReactNode } from "react";

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--background)] text-zinc-900 antialiased">
      <DashboardSidebar />
      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col">
        <DashboardTopBar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

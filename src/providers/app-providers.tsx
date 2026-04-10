"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AppThemeProvider } from "@/providers/app-theme-provider";
import { QueryProvider } from "@/providers/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <ToastProvider>
        <QueryProvider>{children}</QueryProvider>
      </ToastProvider>
    </AppThemeProvider>
  );
}

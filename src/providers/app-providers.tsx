"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { AppThemeProvider } from "@/providers/app-theme-provider";
import { QueryProvider } from "@/providers/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppThemeProvider>
      <ToastProvider>
        <AuthSessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthSessionProvider>
      </ToastProvider>
    </AppThemeProvider>
  );
}

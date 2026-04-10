"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { applyAppThemeToDocument, useAppThemeStore } from "@/stores/app-theme-store";

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useAppThemeStore((s) => s.themeId);

  useLayoutEffect(() => {
    applyAppThemeToDocument(themeId);
  }, [themeId]);

  useLayoutEffect(() => {
    return useAppThemeStore.persist.onFinishHydration(() => {
      applyAppThemeToDocument(useAppThemeStore.getState().themeId);
    });
  }, []);

  return children;
}

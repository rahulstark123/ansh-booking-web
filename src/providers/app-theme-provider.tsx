"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { applyAppThemeToDocument, useAppThemeStore } from "@/stores/app-theme-store";

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useAppThemeStore((s) => s.themeId);
  const mode = useAppThemeStore((s) => s.mode);
  const fontFamily = useAppThemeStore((s) => s.fontFamily);

  useLayoutEffect(() => {
    applyAppThemeToDocument(themeId, mode, fontFamily);
  }, [fontFamily, mode, themeId]);

  useLayoutEffect(() => {
    return useAppThemeStore.persist.onFinishHydration(() => {
      const state = useAppThemeStore.getState();
      applyAppThemeToDocument(state.themeId, state.mode, state.fontFamily);
    });
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const state = useAppThemeStore.getState();
      applyAppThemeToDocument(state.themeId, state.mode, state.fontFamily);
    };
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return children;
}

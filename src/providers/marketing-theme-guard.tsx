"use client";

import { useLayoutEffect, type ReactNode } from "react";

import { applyAppThemeToDocument, useAppThemeStore } from "@/stores/app-theme-store";

/**
 * Dashboard “Appearance” (dark/light + theme) is persisted on <html>. Those global dark rules
 * were bleeding onto marketing pages and inverting the landing design. Marketing routes opt out
 * via `data-marketing-page` + scoped CSS; on unmount we re-apply the user’s real theme.
 */
export function MarketingThemeGuard({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-marketing-page", "true");
    return () => {
      root.removeAttribute("data-marketing-page");
      const s = useAppThemeStore.getState();
      applyAppThemeToDocument(s.themeId, s.mode, s.fontFamily);
    };
  }, []);

  return <>{children}</>;
}

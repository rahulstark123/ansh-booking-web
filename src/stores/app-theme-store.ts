import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Five elegant, WCAG-conscious accent families (600-weight hues on white UI). */
export type AppThemeId = "ocean" | "indigo" | "graphite" | "rose" | "emerald";

export const APP_THEME_ORDER: AppThemeId[] = ["ocean", "indigo", "graphite", "rose", "emerald"];

export const APP_THEME_LABELS: Record<AppThemeId, string> = {
  ocean: "Ocean",
  indigo: "Indigo",
  graphite: "Graphite",
  rose: "Rose",
  emerald: "Emerald",
};

/** CSS custom properties applied on `document.documentElement`. */
export const APP_THEME_CSS: Record<AppThemeId, Record<string, string>> = {
  ocean: {
    "--app-primary": "#0d9488",
    "--app-primary-hover": "#0f7669",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#f0fdfa",
    "--app-primary-soft-text": "#134e4a",
    "--app-primary-soft-border": "#ccfbf1",
    "--app-primary-muted-icon": "#0d9488",
    "--app-focus-border": "#2dd4bf",
    "--app-ring": "rgba(13, 148, 136, 0.22)",
    "--app-row-hover": "rgba(13, 148, 136, 0.07)",
    "--app-gradient-from": "#14b8a6",
    "--app-gradient-to": "#0f7669",
  },
  indigo: {
    "--app-primary": "#4f46e5",
    "--app-primary-hover": "#4338ca",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#eef2ff",
    "--app-primary-soft-text": "#312e81",
    "--app-primary-soft-border": "#e0e7ff",
    "--app-primary-muted-icon": "#4f46e5",
    "--app-focus-border": "#a5b4fc",
    "--app-ring": "rgba(79, 70, 229, 0.22)",
    "--app-row-hover": "rgba(79, 70, 229, 0.07)",
    "--app-gradient-from": "#6366f1",
    "--app-gradient-to": "#4338ca",
  },
  graphite: {
    "--app-primary": "#475569",
    "--app-primary-hover": "#334155",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#f8fafc",
    "--app-primary-soft-text": "#1e293b",
    "--app-primary-soft-border": "#e2e8f0",
    "--app-primary-muted-icon": "#475569",
    "--app-focus-border": "#94a3b8",
    "--app-ring": "rgba(71, 85, 105, 0.25)",
    "--app-row-hover": "rgba(71, 85, 105, 0.08)",
    "--app-gradient-from": "#64748b",
    "--app-gradient-to": "#334155",
  },
  rose: {
    "--app-primary": "#e11d48",
    "--app-primary-hover": "#be123c",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#fff1f2",
    "--app-primary-soft-text": "#881337",
    "--app-primary-soft-border": "#ffe4e6",
    "--app-primary-muted-icon": "#e11d48",
    "--app-focus-border": "#fb7185",
    "--app-ring": "rgba(225, 29, 72, 0.22)",
    "--app-row-hover": "rgba(225, 29, 72, 0.06)",
    "--app-gradient-from": "#f43f5e",
    "--app-gradient-to": "#be123c",
  },
  emerald: {
    "--app-primary": "#059669",
    "--app-primary-hover": "#047857",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#ecfdf5",
    "--app-primary-soft-text": "#064e3b",
    "--app-primary-soft-border": "#d1fae5",
    "--app-primary-muted-icon": "#059669",
    "--app-focus-border": "#34d399",
    "--app-ring": "rgba(5, 150, 105, 0.22)",
    "--app-row-hover": "rgba(5, 150, 105, 0.07)",
    "--app-gradient-from": "#10b981",
    "--app-gradient-to": "#047857",
  },
};

type AppThemeState = {
  themeId: AppThemeId;
  setThemeId: (id: AppThemeId) => void;
};

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      themeId: "ocean",
      setThemeId: (themeId) => set({ themeId }),
    }),
    {
      name: "ansh-bookings-theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ themeId: state.themeId }),
    },
  ),
);

export function applyAppThemeToDocument(themeId: AppThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = APP_THEME_CSS[themeId];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute("data-app-theme", themeId);
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppThemeMode = "light" | "dark" | "system";
export type AppFontFamily = "inter" | "outfit" | "roboto" | "montserrat";
export type AppThemeId =
  | "ocean"
  | "mood-indigo"
  | "graphite"
  | "jade"
  | "aubergine"
  | "barbara"
  | "clementine"
  | "lagoon";

export const APP_THEME_ORDER: AppThemeId[] = [
  "ocean",
  "mood-indigo",
  "graphite",
  "jade",
  "aubergine",
  "barbara",
  "clementine",
  "lagoon",
];

export const APP_THEME_LABELS: Record<AppThemeId, string> = {
  ocean: "Ocean",
  "mood-indigo": "Mood Indigo",
  graphite: "Graphite",
  jade: "Jade",
  aubergine: "Aubergine",
  barbara: "Barbara",
  clementine: "Clementine",
  lagoon: "Lagoon",
};

export const APP_FONT_LABELS: Record<AppFontFamily, string> = {
  inter: "Inter",
  outfit: "Outfit",
  roboto: "Roboto",
  montserrat: "Montserrat",
};

export const APP_FONT_STACKS: Record<AppFontFamily, string> = {
  inter: 'var(--font-inter), "Segoe UI", Arial, sans-serif',
  outfit: 'var(--font-outfit), var(--font-inter), "Segoe UI", Arial, sans-serif',
  roboto: 'var(--font-roboto), var(--font-inter), "Segoe UI", Arial, sans-serif',
  montserrat: 'var(--font-montserrat), var(--font-inter), "Segoe UI", Arial, sans-serif',
};

export const APP_THEME_CSS: Record<AppThemeId, Record<string, string>> = {
  ocean: {
    "--app-primary": "#1d6ff2",
    "--app-primary-rgb": "29, 111, 242",
    "--app-primary-hover": "#1558c7",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#edf4ff",
    "--app-primary-soft-text": "#0f3768",
    "--app-primary-soft-border": "#d8e8ff",
    "--app-primary-muted-icon": "#1d6ff2",
    "--app-focus-border": "#6ca4ff",
    "--app-ring": "rgba(29, 111, 242, 0.24)",
    "--app-row-hover": "rgba(29, 111, 242, 0.09)",
    "--app-gradient-from": "#3a8bff",
    "--app-gradient-to": "#1f5ee0",
  },
  "mood-indigo": {
    "--app-primary": "#4b51f7",
    "--app-primary-rgb": "75, 81, 247",
    "--app-primary-hover": "#373dd6",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#eef0ff",
    "--app-primary-soft-text": "#2a2f88",
    "--app-primary-soft-border": "#dde1ff",
    "--app-primary-muted-icon": "#4b51f7",
    "--app-focus-border": "#8f94ff",
    "--app-ring": "rgba(75, 81, 247, 0.24)",
    "--app-row-hover": "rgba(75, 81, 247, 0.08)",
    "--app-gradient-from": "#6670ff",
    "--app-gradient-to": "#3c43dd",
  },
  graphite: {
    "--app-primary": "#334155",
    "--app-primary-rgb": "51, 65, 85",
    "--app-primary-hover": "#1f2937",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#f2f5f8",
    "--app-primary-soft-text": "#25323f",
    "--app-primary-soft-border": "#dde5ec",
    "--app-primary-muted-icon": "#334155",
    "--app-focus-border": "#7e92a8",
    "--app-ring": "rgba(51, 65, 85, 0.24)",
    "--app-row-hover": "rgba(51, 65, 85, 0.08)",
    "--app-gradient-from": "#4a6178",
    "--app-gradient-to": "#253446",
  },
  jade: {
    "--app-primary": "#0d8e7b",
    "--app-primary-rgb": "13, 142, 123",
    "--app-primary-hover": "#0a7464",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#ecfbf8",
    "--app-primary-soft-text": "#0d4f45",
    "--app-primary-soft-border": "#d3f3ee",
    "--app-primary-muted-icon": "#0d8e7b",
    "--app-focus-border": "#2ec9ae",
    "--app-ring": "rgba(13, 142, 123, 0.24)",
    "--app-row-hover": "rgba(13, 142, 123, 0.08)",
    "--app-gradient-from": "#15b69c",
    "--app-gradient-to": "#0a7667",
  },
  aubergine: {
    "--app-primary": "#6b2bd8",
    "--app-primary-rgb": "107, 43, 216",
    "--app-primary-hover": "#5522ad",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#f3ecff",
    "--app-primary-soft-text": "#461786",
    "--app-primary-soft-border": "#e6d9ff",
    "--app-primary-muted-icon": "#6b2bd8",
    "--app-focus-border": "#9e69ff",
    "--app-ring": "rgba(107, 43, 216, 0.24)",
    "--app-row-hover": "rgba(107, 43, 216, 0.08)",
    "--app-gradient-from": "#8748f1",
    "--app-gradient-to": "#5a25b9",
  },
  barbara: {
    "--app-primary": "#cb205f",
    "--app-primary-rgb": "203, 32, 95",
    "--app-primary-hover": "#a71a4e",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#fff0f6",
    "--app-primary-soft-text": "#7a1038",
    "--app-primary-soft-border": "#ffdbe8",
    "--app-primary-muted-icon": "#cb205f",
    "--app-focus-border": "#f1679a",
    "--app-ring": "rgba(203, 32, 95, 0.24)",
    "--app-row-hover": "rgba(203, 32, 95, 0.08)",
    "--app-gradient-from": "#ef4f86",
    "--app-gradient-to": "#b61e58",
  },
  clementine: {
    "--app-primary": "#b46005",
    "--app-primary-rgb": "180, 96, 5",
    "--app-primary-hover": "#964d00",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#fff5e9",
    "--app-primary-soft-text": "#6d3a00",
    "--app-primary-soft-border": "#ffe3c2",
    "--app-primary-muted-icon": "#b46005",
    "--app-focus-border": "#e18c31",
    "--app-ring": "rgba(180, 96, 5, 0.24)",
    "--app-row-hover": "rgba(180, 96, 5, 0.08)",
    "--app-gradient-from": "#de8122",
    "--app-gradient-to": "#a35403",
  },
  lagoon: {
    "--app-primary": "#0b7ca6",
    "--app-primary-rgb": "11, 124, 166",
    "--app-primary-hover": "#086687",
    "--app-primary-foreground": "#ffffff",
    "--app-primary-soft": "#edf8ff",
    "--app-primary-soft-text": "#094463",
    "--app-primary-soft-border": "#d7ecfb",
    "--app-primary-muted-icon": "#0b7ca6",
    "--app-focus-border": "#42aad1",
    "--app-ring": "rgba(11, 124, 166, 0.24)",
    "--app-row-hover": "rgba(11, 124, 166, 0.08)",
    "--app-gradient-from": "#23a1d0",
    "--app-gradient-to": "#0a6d92",
  },
};

type AppThemeState = {
  themeId: AppThemeId;
  mode: AppThemeMode;
  fontFamily: AppFontFamily;
  setThemeId: (id: AppThemeId) => void;
  setMode: (mode: AppThemeMode) => void;
  setFontFamily: (font: AppFontFamily) => void;
};

export const useAppThemeStore = create<AppThemeState>()(
  persist(
    (set) => ({
      themeId: "ocean",
      mode: "light",
      fontFamily: "inter",
      setThemeId: (themeId) => set({ themeId }),
      setMode: (mode) => set({ mode }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
    }),
    {
      name: "ansh-bookings-theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ themeId: state.themeId, mode: state.mode, fontFamily: state.fontFamily }),
    },
  ),
);

function resolveMode(mode: AppThemeMode): "light" | "dark" {
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode === "dark" ? "dark" : "light";
}

export function applyAppThemeToDocument(themeId: AppThemeId, mode: AppThemeMode, fontFamily: AppFontFamily) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = APP_THEME_CSS[themeId];
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.style.setProperty("--app-font-family", APP_FONT_STACKS[fontFamily]);
  root.style.setProperty("--font-sans", APP_FONT_STACKS[fontFamily]);
  const resolvedMode = resolveMode(mode);
  root.setAttribute("data-app-mode", resolvedMode);
  root.setAttribute("data-app-mode-choice", mode);
  root.setAttribute("data-app-font", fontFamily);
  root.setAttribute("data-app-theme", themeId);
}

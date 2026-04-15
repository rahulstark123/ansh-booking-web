"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

import { DrawerBackdrop } from "@/components/ui/drawer-backdrop";
import {
  APP_FONT_LABELS,
  APP_THEME_CSS,
  APP_THEME_LABELS,
  APP_THEME_ORDER,
  type AppFontFamily,
  type AppThemeMode,
  useAppThemeStore,
} from "@/stores/app-theme-store";

export function AppearanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const themeId = useAppThemeStore((s) => s.themeId);
  const setThemeId = useAppThemeStore((s) => s.setThemeId);
  const mode = useAppThemeStore((s) => s.mode);
  const setMode = useAppThemeStore((s) => s.setMode);
  const fontFamily = useAppThemeStore((s) => s.fontFamily);
  const setFontFamily = useAppThemeStore((s) => s.setFontFamily);
  const previewMode = mode === "system" ? "light" : mode;
  const previewIsDark = previewMode === "dark";

  if (!open) return null;

  return (
    <>
      <DrawerBackdrop onClick={onClose} aria-label="Close appearance studio" />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Appearance</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Optimize visual clarity across light and dark modes with carefully balanced colors and typography.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close appearance modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-zinc-900">Color mode</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Choose whether the app follows light, dark, or your system preference.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {(["light", "dark", "system"] as AppThemeMode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={[
                      "rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition",
                      mode === option
                        ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-zinc-900">Primary color</h3>
              <p className="mt-1 text-sm text-zinc-600">Handpicked palettes for strong readability and low eye strain.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {APP_THEME_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setThemeId(id)}
                    className={[
                      "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                      themeId === id
                        ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)]"
                        : "border-zinc-200 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    <span
                      className="h-8 w-8 rounded-full border border-zinc-200"
                      style={{
                        background: `linear-gradient(135deg, ${APP_THEME_CSS[id]["--app-gradient-from"]}, ${APP_THEME_CSS[id]["--app-gradient-to"]})`,
                      }}
                    />
                    <span className="text-sm font-medium text-zinc-800">{APP_THEME_LABELS[id]}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-zinc-900">Font family</h3>
              <p className="mt-1 text-sm text-zinc-600">Select the global font style for better reading comfort.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(Object.keys(APP_FONT_LABELS) as AppFontFamily[]).map((font) => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setFontFamily(font)}
                    className={[
                      "rounded-xl border px-4 py-3 text-left text-lg transition",
                      fontFamily === font
                        ? "border-[var(--app-primary)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    {APP_FONT_LABELS[font]}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-900">Preview</h3>
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div
                className="flex min-h-[420px]"
                style={{
                  fontFamily:
                    fontFamily === "outfit"
                      ? 'var(--font-outfit), var(--font-inter), "Segoe UI", Arial, sans-serif'
                      : fontFamily === "roboto"
                        ? 'var(--font-roboto), var(--font-inter), "Segoe UI", Arial, sans-serif'
                        : fontFamily === "montserrat"
                          ? 'var(--font-montserrat), var(--font-inter), "Segoe UI", Arial, sans-serif'
                          : 'var(--font-inter), "Segoe UI", Arial, sans-serif',
                  backgroundColor: previewIsDark ? "#121c31" : "#f8fafc",
                  color: previewIsDark ? "#dbe7ff" : "#0f172a",
                }}
              >
                <div
                  className="w-20 shrink-0"
                  style={{
                    background: `linear-gradient(180deg, ${APP_THEME_CSS[themeId]["--app-gradient-from"]}, ${APP_THEME_CSS[themeId]["--app-gradient-to"]})`,
                  }}
                />
                <div className="flex-1 p-4">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: previewIsDark ? "#8da2c9" : "#64748b" }}
                  >
                    Booking page
                  </p>
                  <h4 className="mt-1 text-lg font-semibold">Product Discovery Call</h4>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: previewIsDark ? "#b6c7e8" : "#475569" }}>
                    Discuss your goals and set clear next steps. Theme + font updates render here live.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className="rounded-full px-2.5 py-1 font-medium"
                      style={{
                        backgroundColor: APP_THEME_CSS[themeId]["--app-primary-soft"],
                        color: APP_THEME_CSS[themeId]["--app-primary-soft-text"],
                      }}
                    >
                      30 minutes
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 font-medium"
                      style={{
                        backgroundColor: previewIsDark ? "#1d2a45" : "#e2e8f0",
                        color: previewIsDark ? "#c9d8f3" : "#334155",
                      }}
                    >
                      Google Meet
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-5 rounded-lg px-3.5 py-2 text-sm font-semibold"
                    style={{
                      backgroundColor: APP_THEME_CSS[themeId]["--app-primary"],
                      color: APP_THEME_CSS[themeId]["--app-primary-foreground"],
                    }}
                  >
                    Confirm booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


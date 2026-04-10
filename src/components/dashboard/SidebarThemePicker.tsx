"use client";

import { APP_THEME_CSS, APP_THEME_LABELS, APP_THEME_ORDER, useAppThemeStore } from "@/stores/app-theme-store";

export function SidebarThemePicker({ collapsed }: { collapsed: boolean }) {
  const themeId = useAppThemeStore((s) => s.themeId);
  const setThemeId = useAppThemeStore((s) => s.setThemeId);

  return (
    <div className={[collapsed ? "flex flex-col items-center gap-2 px-0" : "px-1"].join(" ")}>
      {!collapsed && (
        <p className="mb-2 px-2 text-[11px] font-medium text-zinc-500" id="theme-picker-label">
          Theme
        </p>
      )}
      <div
        className={["flex gap-2", collapsed ? "flex-col" : "flex-wrap px-2"].join(" ")}
        role="group"
        aria-labelledby={collapsed ? undefined : "theme-picker-label"}
      >
        {APP_THEME_ORDER.map((id) => {
          const primary = APP_THEME_CSS[id]["--app-primary"];
          const selected = themeId === id;
          return (
            <button
              key={id}
              type="button"
              title={APP_THEME_LABELS[id]}
              aria-label={`${APP_THEME_LABELS[id]} theme`}
              aria-pressed={selected}
              onClick={() => setThemeId(id)}
              className={[
                "h-7 w-7 shrink-0 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                selected ? "border-zinc-900 shadow-sm" : "border-transparent hover:border-zinc-300",
              ].join(" ")}
              style={{ backgroundColor: primary }}
            />
          );
        })}
      </div>
    </div>
  );
}

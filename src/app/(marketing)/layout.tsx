import type { ReactNode } from "react";

import { MarketingThemeGuard } from "@/providers/marketing-theme-guard";

/** Public pages (home, auth, legal, contact): fixed styling; dashboard Appearance must not restyle them. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingThemeGuard>{children}</MarketingThemeGuard>;
}

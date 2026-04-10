import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardGate } from "@/components/dashboard/DashboardGate";

export const metadata: Metadata = {
  title: "Dashboard · ANSH Bookings",
  description: "Manage bookings, clients, and your schedule",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardGate>{children}</DashboardGate>;
}

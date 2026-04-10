import { create } from "zustand";

export type EventTypeChoice = "one-on-one" | "group" | "round-robin" | null;

type DashboardUiState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  newBookingModalOpen: boolean;
  openNewBookingModal: () => void;
  closeNewBookingModal: () => void;
  lastEventTypeChoice: EventTypeChoice;
  setLastEventTypeChoice: (t: EventTypeChoice) => void;
};

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  newBookingModalOpen: false,
  openNewBookingModal: () => set({ newBookingModalOpen: true }),
  closeNewBookingModal: () => set({ newBookingModalOpen: false }),
  lastEventTypeChoice: null,
  setLastEventTypeChoice: (lastEventTypeChoice) => set({ lastEventTypeChoice }),
}));

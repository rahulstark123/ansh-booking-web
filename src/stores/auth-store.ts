import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "Free host" | "Pro host";
  plan: "FREE" | "PRO";
  avatarUrl?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (loading) => set({ loading }),
}));

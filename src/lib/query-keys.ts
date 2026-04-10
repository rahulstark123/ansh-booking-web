export const queryKeys = {
  dashboard: {
    root: ["dashboard"] as const,
    overview: () => [...queryKeys.dashboard.root, "overview"] as const,
    agenda: () => [...queryKeys.dashboard.root, "agenda"] as const,
    activity: () => [...queryKeys.dashboard.root, "activity"] as const,
  },
} as const;

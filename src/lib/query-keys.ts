export const queryKeys = {
  auth: {
    root: ["auth"] as const,
    profile: (userId: string) => [...queryKeys.auth.root, "profile", userId] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    overview: () => [...queryKeys.dashboard.root, "overview"] as const,
    agenda: () => [...queryKeys.dashboard.root, "agenda"] as const,
    activity: () => [...queryKeys.dashboard.root, "activity"] as const,
  },
  meetings: {
    root: ["meetings"] as const,
    list: (hostId: string) => [...queryKeys.meetings.root, "list", hostId] as const,
  },
} as const;

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
    list: (hostId: string, page: number, pageSize: number) =>
      [...queryKeys.meetings.root, "list", hostId, page, pageSize] as const,
  },
  bookedMeetings: {
    root: ["bookedMeetings"] as const,
    list: (hostId: string, page: number, pageSize: number, filter: string) =>
      [...queryKeys.bookedMeetings.root, "list", hostId, page, pageSize, filter] as const,
  },
  contacts: {
    root: ["contacts"] as const,
    list: (hostId: string, q: string, filter: string, page: number, pageSize: number) =>
      [...queryKeys.contacts.root, "list", hostId, q, filter, page, pageSize] as const,
  },
  availability: {
    root: ["availability"] as const,
    weekly: (hostId: string) => [...queryKeys.availability.root, "weekly", hostId] as const,
  },
} as const;

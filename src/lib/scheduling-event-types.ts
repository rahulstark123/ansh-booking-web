export type SchedulingEventTypeId = "one-on-one" | "group" | "round-robin";

export type SchedulingEventType = {
  id: SchedulingEventTypeId;
  title: string;
  hostLabel: string;
  inviteeLabel: string;
  description: string;
  durationMinutes: number;
};

export const SCHEDULING_EVENT_TYPES: SchedulingEventType[] = [
  {
    id: "one-on-one",
    title: "One-on-one",
    hostLabel: "1 host",
    inviteeLabel: "1 invitee",
    description: "Good for coffee chats, 1:1 interviews, and private sessions.",
    durationMinutes: 30,
  },
  {
    id: "group",
    title: "Group",
    hostLabel: "1 host",
    inviteeLabel: "Multiple invitees",
    description: "Webinars, online classes, and workshops.",
    durationMinutes: 45,
  },
  {
    id: "round-robin",
    title: "Round robin",
    hostLabel: "Rotating hosts",
    inviteeLabel: "1 invitee",
    description: "Distribute meetings between team members automatically.",
    durationMinutes: 30,
  },
];

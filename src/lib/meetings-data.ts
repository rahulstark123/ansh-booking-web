export type MeetingStatus = "Upcoming" | "Completed";

export type ScheduledMeeting = {
  id: string;
  title: string;
  eventType: string;
  guest: string;
  time: string;
  status: MeetingStatus;
  meetingLink?: string | null;
  /** Stored location key from the event type (e.g. google-meet). */
  location: string;
  /** Human-readable platform for list UIs. */
  platform: string;
};

export const SCHEDULED_MEETINGS: ScheduledMeeting[] = [
  {
    id: "m1",
    title: "Discovery call",
    eventType: "One-on-one",
    guest: "Aarav Sharma",
    time: "Today, 04:30 PM",
    status: "Upcoming",
    location: "google-meet",
    platform: "Google Meet",
  },
  {
    id: "m2",
    title: "Product onboarding",
    eventType: "Group",
    guest: "Growth Team",
    time: "Tomorrow, 11:00 AM",
    status: "Upcoming",
    location: "zoom",
    platform: "Zoom",
  },
  {
    id: "m3",
    title: "Support review",
    eventType: "Round robin",
    guest: "Client Ops",
    time: "Thu, 02:00 PM",
    status: "Upcoming",
    location: "phone",
    platform: "Phone call",
  },
  {
    id: "m4",
    title: "Weekly sync",
    eventType: "One-on-one",
    guest: "Neha Verma",
    time: "Yesterday, 06:00 PM",
    status: "Completed",
    location: "in-person",
    platform: "In person",
  },
];

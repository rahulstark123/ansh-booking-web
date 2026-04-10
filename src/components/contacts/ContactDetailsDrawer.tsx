"use client";

import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import type { Contact } from "@/lib/contacts-data";

export function ContactDetailsDrawer({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  if (!contact) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-zinc-900/20"
        aria-label="Close contact details"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-zinc-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-zinc-900">{contact.name}</p>
            <p className="text-sm text-zinc-500">{contact.company}</p>
            <span className="mt-2 inline-block rounded-md bg-[var(--app-primary-soft)] px-2 py-1 text-xs font-medium text-[var(--app-primary-soft-text)]">
              {contact.tag}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close details"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <InfoRow icon={<EnvelopeIcon className="h-4 w-4 text-zinc-400" />} text={contact.email} />
          <InfoRow icon={<PhoneIcon className="h-4 w-4 text-zinc-400" />} text={contact.phone} />
          <InfoRow icon={<CalendarDaysIcon className="h-4 w-4 text-zinc-400" />} text={`Next: ${contact.nextMeeting}`} />
          {contact.jobTitle && <InfoRow icon={<ChatBubbleLeftRightIcon className="h-4 w-4 text-zinc-400" />} text={contact.jobTitle} />}
          {contact.timezone && <InfoRow icon={<CalendarDaysIcon className="h-4 w-4 text-zinc-400" />} text={contact.timezone} />}
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</p>
          <p className="text-sm text-zinc-700">{contact.notes}</p>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recent activity</p>
          <TimelineItem text="Booked via scheduling link" />
          <TimelineItem text={`Owner assigned: ${contact.owner}`} />
          <TimelineItem text="Reminder sent 24 hours before meeting" />
        </div>
      </aside>
    </>
  );
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-2 text-zinc-700">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}

function TimelineItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-zinc-600">
      <ChatBubbleLeftRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
      <span>{text}</span>
    </div>
  );
}

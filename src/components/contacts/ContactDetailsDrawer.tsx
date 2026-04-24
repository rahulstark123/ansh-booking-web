import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UserCircleIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { DrawerBackdrop } from "@/components/ui/drawer-backdrop";
import type { Contact } from "@/lib/contacts-data";

export function ContactDetailsDrawer({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {contact && (
        <>
          <DrawerBackdrop onClick={onClose} aria-label="Close contact details" />
          <motion.aside 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-[var(--app-primary-soft)] flex items-center justify-center border border-[var(--app-primary-soft-border)]">
                  <span className="text-2xl font-black text-[var(--app-primary)]">{contact.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900">{contact.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                      {contact.tag}
                    </span>
                    {contact.company && (
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <BuildingOfficeIcon className="h-3.5 w-3.5" />
                        {contact.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-95"
                aria-label="Close details"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Contact Intelligence</p>
              
              <div className="grid gap-3">
                <InfoRow 
                  icon={<EnvelopeIcon className="h-4 w-4 text-[var(--app-primary)]" />} 
                  label="Email"
                  value={contact.email} 
                />
                <InfoRow 
                  icon={<PhoneIcon className="h-4 w-4 text-emerald-500" />} 
                  label="Phone"
                  value={contact.phone} 
                />
                <InfoRow 
                  icon={<IdentificationIcon className="h-4 w-4 text-blue-500" />} 
                  label="Role"
                  value={contact.jobTitle || "Not specified"} 
                />
                <InfoRow 
                  icon={<CalendarDaysIcon className="h-4 w-4 text-rose-500" />} 
                  label="Next Sync"
                  value={contact.nextMeeting} 
                />
              </div>

              {/* Notes Module */}
              <div className="rounded-3xl border border-zinc-100 bg-zinc-50/50 p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Relationship Notes</p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-700">
                  {contact.notes || "No historical notes recorded for this contact yet."}
                </p>
              </div>

              {/* Activity Timeline */}
              <div className="rounded-3xl border border-zinc-200 p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">Recent Interaction Flow</p>
                <div className="space-y-6">
                  <TimelineItem 
                    icon={<ClockIcon className="h-4 w-4" />}
                    title="Booked via scheduling link" 
                    time="2 hours ago"
                  />
                  <TimelineItem 
                    icon={<UserCircleIcon className="h-4 w-4" />}
                    title={`Owner assigned to ${contact.owner}`} 
                    time="Yesterday"
                  />
                  <TimelineItem 
                    icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                    title="Automated reminder sent" 
                    time="3 days ago"
                    last
                  />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--app-primary-soft-border)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400">{label}</p>
        <p className="truncate text-sm font-black text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({ icon, title, time, last }: { icon: ReactNode; title: string; time: string; last?: boolean }) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-[2px] bg-zinc-100" />
      )}
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border-2 border-zinc-100 text-zinc-400">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-zinc-900">{title}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{time}</p>
      </div>
    </div>
  );
}

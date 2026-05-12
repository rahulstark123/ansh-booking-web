"use client";

import { FunnelIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon, BuildingOfficeIcon, CalendarIcon, ClockIcon, EllipsisHorizontalIcon, EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import type { Contact } from "@/lib/contacts-data";

export function ContactTable({
  contacts,
  selectedId,
  onSelect,
  page,
  totalPages,
  total,
  onPrevPage,
  onNextPage,
  onEdit,
  onDelete,
  isLoading,
  isError
}: {
  contacts: Contact[];
  selectedId: string;
  onSelect: (id: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
}) {
  return (
    <>


      <div className="min-w-full">
        <div className="grid grid-cols-[1.5fr_1.2fr_1fr_1fr_40px] gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50">
          <span>Contact</span>
          <span>Organization</span>
          <span>Last Touch</span>
          <span>Next Up</span>
          <span className="sr-only">Actions</span>
        </div>

        {isError && (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-rose-500">Failed to sync contacts</p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full animate-pulse rounded-2xl bg-zinc-50" />
            ))}
          </div>
        )}

        {!isLoading && !isError && contacts.length === 0 && (
          <div className="p-16 text-center">
            <UserIcon className="h-10 w-10 text-zinc-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-zinc-400">No matching contacts found</p>
          </div>
        )}

        <ul className="divide-y divide-zinc-50 px-2 py-2">
          {contacts.map((c, idx) => (
            <motion.li 
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative"
            >
              <div
                className={[
                  "grid w-full grid-cols-[1.5fr_1.2fr_1fr_1fr_40px] gap-4 rounded-2xl px-4 py-3.5 text-left text-sm transition-all",
                  selectedId === c.id ? "bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary-soft-border)]" : "hover:bg-zinc-50",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex items-center gap-3 min-w-0"
                >
                  <div className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold transition-all",
                    selectedId === c.id ? "bg-[var(--app-primary)] text-white scale-110 shadow-md" : "bg-zinc-100 text-zinc-500"
                  ].join(" ")}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="block truncate font-extrabold text-zinc-900 leading-tight">{c.name}</span>
                    <span className="block truncate text-[10px] font-bold text-zinc-400 mt-0.5">{c.email}</span>
                    {c.phone && <span className="block truncate text-[10px] font-medium text-[var(--app-primary)] mt-0.5">{c.phone}</span>}
                  </div>
                </button>

                <div className="flex items-center gap-2 truncate font-bold text-zinc-600">
                  <BuildingOfficeIcon className="h-4 w-4 shrink-0 text-zinc-300" />
                  <span className="truncate">{c.company || "Personal"}</span>
                </div>

                <div className="flex items-center gap-2 font-bold text-zinc-500">
                  <ClockIcon className="h-4 w-4 shrink-0 text-zinc-300" />
                  <span className="tabular-nums">{c.lastMeeting || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 font-bold text-zinc-900">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--app-primary)]" />
                  <span className="tabular-nums">{c.nextMeeting || "Unscheduled"}</span>
                </div>

                <div className="flex items-center justify-end">
                   <ContactActionMenu 
                     contact={c} 
                     onSelect={onSelect}
                     onEdit={onEdit}
                     onDelete={onDelete}
                   />
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 p-6 px-8">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest tabular-nums">
          Page <span className="text-zinc-900">{page}</span> / {totalPages}
          <span className="mx-3 text-zinc-200">|</span>
          <span className="text-zinc-900">{total}</span> total
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page <= 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

function ContactActionMenu({ 
  contact, 
  onSelect,
  onEdit,
  onDelete 
}: { 
  contact: Contact;
  onSelect: (id: string) => void;
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
            >
              <div className="p-1">
                <button
                  onClick={() => { onSelect(contact.id); setIsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:text-[var(--app-primary)]"
                >
                  <EyeIcon className="h-4 w-4" />
                  Preview
                </button>
                <button
                  onClick={() => { onEdit(contact); setIsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-zinc-600 transition-all hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <div className="my-1 border-t border-zinc-100" />
                <button
                  onClick={() => { onDelete(contact.id); setIsOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-500 transition-all hover:bg-rose-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

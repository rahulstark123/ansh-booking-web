"use client";

import { FunnelIcon } from "@heroicons/react/24/outline";

import type { Contact, FilterId } from "@/lib/contacts-data";

export function ContactTable({
  contacts,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  page,
  totalPages,
  total,
  onPrevPage,
  onNextPage,
}: {
  contacts: Contact[];
  filter: FilterId;
  onFilterChange: (value: FilterId) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <FunnelIcon className="h-3.5 w-3.5" />
          Filters
        </span>
        {(["all", "VIP", "Warm", "Trial", "No meetings"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={[
              "rounded-md border px-2.5 py-1 text-xs font-medium transition",
              filter === f
                ? "border-[var(--app-primary-soft-border)] bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-2 bg-zinc-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          <span>Contact</span>
          <span>Company</span>
          <span>Last meeting</span>
          <span>Next meeting</span>
        </div>
        <ul className="divide-y divide-zinc-100">
          {contacts.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={[
                  "grid w-full grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-2 px-3 py-2.5 text-left text-sm transition",
                  selectedId === c.id ? "bg-[var(--app-primary-soft)]" : "hover:bg-zinc-50",
                ].join(" ")}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-900">{c.name}</span>
                  <span className="block truncate text-xs text-zinc-500">{c.email}</span>
                </span>
                <span className="truncate text-zinc-700">{c.company}</span>
                <span className="text-zinc-600">{c.lastMeeting}</span>
                <span className="text-zinc-600">{c.nextMeeting}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Page {page} of {totalPages} - {total} total
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page <= 1}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

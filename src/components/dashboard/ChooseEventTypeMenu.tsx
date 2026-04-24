"use client";

import {
  ArrowPathIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { SCHEDULING_EVENT_TYPES, type SchedulingEventTypeId } from "@/lib/scheduling-event-types";

export function ChooseEventTypeMenu({
  onSelect,
}: {
  onSelect: (id: SchedulingEventTypeId) => void;
}) {
  return (
    <div className="p-2 divide-y divide-zinc-50">
      {SCHEDULING_EVENT_TYPES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className="group flex gap-5 w-full rounded-2xl p-5 text-left transition-all hover:bg-zinc-50/80 active:scale-[0.98]"
        >
          <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 shadow-sm transition-transform group-hover:scale-[1.02]">
            <img 
              src={`/previews/${item.id}.png`} 
              alt={item.title}
              className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-[var(--app-primary)] group-hover:shadow-sm transition-all">
                {item.id === "one-on-one" ? (
                  <UserIcon className="h-4 w-4" />
                ) : item.id === "group" ? (
                  <UserGroupIcon className="h-4 w-4" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
              </span>
              <p className="text-[15px] font-black text-zinc-900 uppercase tracking-tight group-hover:text-[var(--app-primary)] transition-colors truncate">
                {item.title}
              </p>
            </div>
            <p className="mt-2.5 text-[13px] font-bold text-zinc-500 leading-relaxed group-hover:text-zinc-600">
              {item.description}
            </p>
            <div className="mt-3.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <span>{item.hostLabel}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span>{item.inviteeLabel}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

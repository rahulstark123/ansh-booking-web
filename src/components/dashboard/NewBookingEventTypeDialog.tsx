"use client";

import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, type RefObject } from "react";

import { SCHEDULING_EVENT_TYPES } from "@/lib/scheduling-event-types";
import { useDashboardUiStore, type EventTypeChoice } from "@/stores/dashboard-ui-store";

export function NewBookingEventTypeDialog({
  anchorRef,
  collapsed,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  collapsed: boolean;
}) {
  const open = useDashboardUiStore((s) => s.newBookingModalOpen);
  const close = useDashboardUiStore((s) => s.closeNewBookingModal);
  const setChoice = useDashboardUiStore((s) => s.setLastEventTypeChoice);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const inPopover = popoverRef.current?.contains(target);
      const inAnchor = anchorRef.current?.contains(target);
      if (!inPopover && !inAnchor) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, close, open]);

  function pickType(id: Exclude<EventTypeChoice, null>) {
    setChoice(id);
    close();
  }

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-labelledby="new-booking-event-types-title"
      className={[
        "absolute top-[calc(100%+0.5rem)] z-50 w-[19rem] overflow-hidden rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl shadow-zinc-900/10",
        collapsed ? "left-full ml-2" : "left-0",
      ].join(" ")}
    >
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={close}
            className="absolute top-0 right-0 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>

          <p className="text-xs font-medium text-zinc-500">New booking</p>
          <h2 id="new-booking-event-types-title" className="mt-0.5 pr-9 text-base font-semibold tracking-tight text-zinc-900">
            Choose event type
          </h2>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {SCHEDULING_EVENT_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => pickType(item.id)}
            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-[var(--app-row-hover)]"
          >
            <span className="text-base font-semibold text-zinc-900">{item.title}</span>
            <span className="flex flex-wrap items-center gap-1 text-sm text-zinc-500">
              <span>{item.hostLabel}</span>
              <ArrowRightIcon className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
              <span>{item.inviteeLabel}</span>
            </span>
            <span className="text-xs leading-snug text-zinc-500">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

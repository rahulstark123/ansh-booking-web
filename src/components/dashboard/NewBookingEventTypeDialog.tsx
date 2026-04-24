"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";

import { ChooseEventTypeMenu } from "./ChooseEventTypeMenu";
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

  const router = useRouter();

  function pickType(id: Exclude<EventTypeChoice, null>) {
    setChoice(id);
    close();
    if (window.location.pathname !== "/dashboard/scheduling") {
      router.push("/dashboard/scheduling");
    }
  }

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-labelledby="new-booking-event-types-title"
      className={[
        "absolute top-[calc(100%+0.5rem)] z-50 w-[26rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl",
        collapsed ? "left-full ml-2" : "left-0",
      ].join(" ")}
    >
      <div className="border-b border-zinc-100 px-6 py-5">
        <div className="relative">
          <button
            type="button"
            onClick={close}
            className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400">
            Choose Event Type
          </h3>
        </div>
      </div>

      <ChooseEventTypeMenu onSelect={pickType} />
    </div>
  );
}

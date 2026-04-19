/**
 * Booking **page templates**: different calendar layouts and chrome for `/book/[hostId]`.
 * Stored on `BookingEventType.bookingPageTheme` (historical column name).
 */

export const BOOKING_PAGE_TEMPLATE_IDS = [
  "simple",
  "vintage",
  "modern",
  "compact",
  "editorial",
] as const;

export type BookingPageTemplateId = (typeof BOOKING_PAGE_TEMPLATE_IDS)[number];

/** Old palette-only values → default layout. */
const LEGACY_TO_TEMPLATE: Record<string, BookingPageTemplateId> = {
  default: "simple",
  aurora: "simple",
  ocean: "simple",
  sunset: "simple",
  forest: "simple",
  midnight: "simple",
};

export function normalizeBookingPageTemplate(raw: string | null | undefined): BookingPageTemplateId {
  const v = (raw ?? "simple").trim().toLowerCase();
  if (LEGACY_TO_TEMPLATE[v]) return LEGACY_TO_TEMPLATE[v];
  if ((BOOKING_PAGE_TEMPLATE_IDS as readonly string[]).includes(v)) return v as BookingPageTemplateId;
  return "simple";
}

/** Backwards-compatible alias used by API + older imports */
export const normalizeBookingPageTheme = normalizeBookingPageTemplate;
export type BookingPageThemeId = BookingPageTemplateId;
export const BOOKING_PAGE_THEME_IDS = BOOKING_PAGE_TEMPLATE_IDS;
export function getBookingPageThemeClasses(id: string | null | undefined) {
  return getTemplateShell(normalizeBookingPageTemplate(id));
}

export const BOOKING_PAGE_THEME_OPTIONS: Array<{
  id: BookingPageTemplateId;
  label: string;
  hint: string;
}> = [
  { id: "simple", label: "Simple", hint: "Round days, side time list — classic Cal.com style" },
  { id: "vintage", label: "Vintage", hint: "Paper ledger, serif, framed calendar grid" },
  { id: "modern", label: "Modern", hint: "Bento squares, pill time slots, bold spacing" },
  { id: "compact", label: "Compact", hint: "Narrow card, dense grid, stacked slots" },
  { id: "editorial", label: "Editorial", hint: "Magazine headline + asymmetric layout" },
];

/** Re-export for scheduling drawer */
export const BOOKING_PAGE_TEMPLATE_OPTIONS = BOOKING_PAGE_THEME_OPTIONS;

export type TemplateShell = {
  pageWrap: string;
  pageInner: string;
  cardLayout: string;
  card: string;
  aside: string;
  asideBorder: string;
  backBtn: string;
  hostName: string;
  eventTitle: string;
  durationRow: string;
  slotWhen: string;
  slotTz: string;
  joinLink: string;
  section: string;
  h2: string;
  lead: string;
  label: string;
  input: string;
  phoneInputClass: string;
  phoneButtonClass: string;
  scheduleBtn: string;
  confirmedWrap: string;
  confirmedTitle: string;
  confirmedText: string;
};

const phoneLight =
  "!w-full !h-[42px] !rounded-lg !border-zinc-200 !bg-white !pl-14 !text-sm !text-zinc-900 focus:!border-blue-400 focus:!ring-2 focus:!ring-blue-100";
const phoneLightBtn = "!border-zinc-200 !bg-white hover:!bg-zinc-50";

const shells: Record<BookingPageTemplateId, TemplateShell> = {
  simple: {
    pageWrap: "bg-zinc-50",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[340px_1fr]",
    card: "border-zinc-200 bg-white shadow-sm",
    aside: "border-r border-zinc-200 bg-white p-8",
    asideBorder: "border-zinc-200",
    backBtn: "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
    hostName: "text-zinc-800",
    eventTitle: "text-4xl font-bold tracking-tight text-zinc-900",
    durationRow: "text-zinc-700",
    slotWhen: "text-zinc-700",
    slotTz: "text-zinc-600",
    joinLink: "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    section: "bg-white p-8",
    h2: "text-zinc-900",
    lead: "text-zinc-500",
    label: "text-zinc-800",
    input: "border-zinc-200 text-zinc-900 focus:border-blue-400 focus:ring-blue-100",
    phoneInputClass: phoneLight,
    phoneButtonClass: phoneLightBtn,
    scheduleBtn: "bg-blue-600 text-white hover:bg-blue-700",
    confirmedWrap: "border-emerald-200 bg-emerald-50",
    confirmedTitle: "text-emerald-900",
    confirmedText: "text-emerald-800",
  },
  vintage: {
    pageWrap: "bg-[#e8dcc8] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f5ead8] to-[#dccfb5]",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[minmax(280px,340px)_1fr]",
    card: "border-4 border-amber-900/25 bg-[#faf6ef] shadow-[8px_8px_0_0_rgba(120,53,15,0.12)]",
    aside: "border-r-4 border-amber-900/20 bg-[#f7f0e4] p-8 font-serif",
    asideBorder: "border-amber-900/20",
    backBtn: "border-amber-800/40 text-amber-950 hover:bg-amber-100/80",
    hostName: "text-amber-950/90 tracking-wide",
    eventTitle: "text-amber-950 text-3xl sm:text-4xl font-semibold tracking-tight",
    durationRow: "text-amber-900",
    slotWhen: "text-amber-950",
    slotTz: "text-amber-800",
    joinLink: "border-amber-800/40 text-amber-950 hover:bg-amber-100",
    section: "bg-[#faf8f3] p-8 font-serif text-amber-950",
    h2: "text-amber-950",
    lead: "text-amber-800/90",
    label: "text-amber-950",
    input: "border-amber-900/30 bg-[#fffdf8] text-amber-950 focus:border-amber-700 focus:ring-amber-200",
    phoneInputClass:
      "!w-full !h-[42px] !rounded-md !border-amber-900/30 !bg-[#fffdf8] !pl-14 !text-sm !text-amber-950 focus:!border-amber-700 focus:!ring-2 focus:!ring-amber-200",
    phoneButtonClass: "!border-amber-900/30 !bg-[#fffdf8] hover:!bg-amber-50",
    scheduleBtn: "rounded-md border-2 border-amber-900 bg-amber-900 text-[#faf6ef] hover:bg-amber-950",
    confirmedWrap: "border-2 border-emerald-800/40 bg-emerald-50/90",
    confirmedTitle: "text-emerald-950",
    confirmedText: "text-emerald-900",
  },
  modern: {
    pageWrap: "bg-gradient-to-br from-slate-100 via-white to-violet-50",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[minmax(300px,360px)_1fr]",
    card: "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40",
    aside: "border-r border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-8 md:p-10",
    asideBorder: "border-slate-200/80",
    backBtn: "rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100",
    hostName: "text-sm font-semibold uppercase tracking-wider text-violet-600",
    eventTitle: "text-4xl font-bold tracking-tight text-slate-900",
    durationRow: "text-slate-600",
    slotWhen: "text-slate-800",
    slotTz: "text-slate-500",
    joinLink: "rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50",
    section: "bg-white p-8 md:p-10",
    h2: "text-slate-900",
    lead: "text-slate-500",
    label: "text-slate-800",
    input: "rounded-2xl border-slate-200 text-slate-900 focus:border-violet-400 focus:ring-violet-100",
    phoneInputClass:
      "!w-full !h-[42px] !rounded-2xl !border-slate-200 !bg-white !pl-14 !text-sm !text-slate-900 focus:!border-violet-400 focus:!ring-2 focus:!ring-violet-100",
    phoneButtonClass: "!rounded-2xl !border-slate-200 !bg-white hover:!bg-slate-50",
    scheduleBtn: "rounded-full bg-violet-600 px-6 text-white hover:bg-violet-700",
    confirmedWrap: "rounded-3xl border border-emerald-200 bg-emerald-50/90",
    confirmedTitle: "text-emerald-900",
    confirmedText: "text-emerald-800",
  },
  compact: {
    pageWrap: "bg-zinc-100",
    pageInner: "max-w-lg",
    cardLayout: "grid-cols-1",
    card: "rounded-xl border border-zinc-200 bg-white shadow-md",
    aside: "border-b border-zinc-200 bg-zinc-50 p-6 md:border-b-0 md:border-r md:border-zinc-200 md:p-6",
    asideBorder: "border-zinc-200",
    backBtn: "border-zinc-200 text-zinc-600 hover:bg-white",
    hostName: "text-sm font-medium text-zinc-600",
    eventTitle: "text-2xl font-bold text-zinc-900",
    durationRow: "text-sm text-zinc-600",
    slotWhen: "text-sm text-zinc-800",
    slotTz: "text-xs text-zinc-500",
    joinLink: "border-zinc-200 text-zinc-700 hover:bg-white text-sm",
    section: "p-5 md:p-6",
    h2: "text-xl font-bold text-zinc-900",
    lead: "text-sm text-zinc-500",
    label: "text-sm font-medium text-zinc-800",
    input: "rounded-md border-zinc-200 text-sm text-zinc-900 focus:border-blue-500 focus:ring-blue-100",
    phoneInputClass: phoneLight.replace("rounded-lg", "rounded-md"),
    phoneButtonClass: phoneLightBtn.replace("rounded-lg", "rounded-md"),
    scheduleBtn: "w-full rounded-md bg-blue-600 text-sm text-white hover:bg-blue-700",
    confirmedWrap: "rounded-lg border border-emerald-200 bg-emerald-50",
    confirmedTitle: "text-lg font-bold text-emerald-900",
    confirmedText: "text-sm text-emerald-800",
  },
  editorial: {
    pageWrap: "bg-white",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[minmax(260px,320px)_1fr]",
    card: "border-y border-zinc-900 md:border md:rounded-none",
    aside: "border-r-0 border-b border-zinc-900 bg-white p-8 md:border-b-0 md:border-r md:border-zinc-900",
    asideBorder: "border-zinc-900",
    backBtn: "rounded-none border border-zinc-900 text-zinc-900 hover:bg-zinc-100",
    hostName: "text-xs font-bold uppercase tracking-[0.2em] text-zinc-500",
    eventTitle: "font-serif text-4xl font-light text-zinc-900 md:text-5xl",
    durationRow: "text-sm text-zinc-600",
    slotWhen: "font-serif text-lg text-zinc-900",
    slotTz: "text-sm text-zinc-500",
    joinLink: "border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white",
    section: "bg-white p-8 md:p-12",
    h2: "font-serif text-5xl font-light tracking-tight text-zinc-900 md:text-6xl",
    lead: "text-zinc-500",
    label: "text-xs font-bold uppercase tracking-wider text-zinc-700",
    input: "rounded-none border border-zinc-900 bg-white text-zinc-900 focus:ring-1 focus:ring-zinc-900",
    phoneInputClass:
      "!w-full !h-[42px] !rounded-none !border !border-zinc-900 !bg-white !pl-14 !text-sm !text-zinc-900 focus:!ring-1 focus:!ring-zinc-900",
    phoneButtonClass: "!rounded-none !border !border-zinc-900 !bg-white hover:!bg-zinc-100",
    scheduleBtn: "rounded-none border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-white hover:text-zinc-900",
    confirmedWrap: "border border-zinc-900 bg-zinc-50",
    confirmedTitle: "font-serif text-2xl text-zinc-900",
    confirmedText: "text-zinc-700",
  },
};

export function getTemplateShell(id: string | null | undefined): TemplateShell {
  return shells[normalizeBookingPageTemplate(id)];
}

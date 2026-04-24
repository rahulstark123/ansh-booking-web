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
    pageWrap: "bg-zinc-50/50",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[360px_1fr]",
    card: "border-zinc-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
    aside: "border-r border-zinc-100 bg-white p-10",
    asideBorder: "border-zinc-100",
    backBtn: "border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
    hostName: "text-zinc-500 text-sm font-bold uppercase tracking-widest",
    eventTitle: "text-4xl font-black tracking-tight text-zinc-900",
    durationRow: "text-zinc-600 font-bold",
    slotWhen: "text-zinc-900 font-black",
    slotTz: "text-zinc-400 font-medium",
    joinLink: "border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm",
    section: "bg-white p-10",
    h2: "text-zinc-900 font-black tracking-tight",
    lead: "text-zinc-500 font-medium",
    label: "text-zinc-800 font-bold",
    input: "rounded-2xl border-zinc-200 text-zinc-900 focus:border-[var(--app-primary)] focus:ring-[var(--app-primary-soft)]",
    phoneInputClass: phoneLight.replace("rounded-lg", "rounded-2xl"),
    phoneButtonClass: phoneLightBtn.replace("rounded-lg", "rounded-2xl"),
    scheduleBtn: "bg-zinc-900 text-white hover:bg-black shadow-xl shadow-zinc-200",
    confirmedWrap: "rounded-3xl border-emerald-100 bg-emerald-50/50",
    confirmedTitle: "text-emerald-900 font-black",
    confirmedText: "text-emerald-800 font-medium",
  },
  vintage: {
    pageWrap: "bg-[#e8dcc8] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f5ead8] to-[#dccfb5]",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[minmax(300px,360px)_1fr]",
    card: "border-[6px] border-amber-900/10 bg-[#faf6ef] shadow-[20px_20px_0_0_rgba(120,53,15,0.05)]",
    aside: "border-r-2 border-amber-900/10 bg-[#f7f0e4] p-10 font-serif",
    asideBorder: "border-amber-900/10",
    backBtn: "border-amber-800/20 text-amber-950 hover:bg-amber-100",
    hostName: "text-amber-900/60 text-xs font-bold uppercase tracking-[0.3em]",
    eventTitle: "text-amber-950 text-4xl font-medium tracking-tight italic",
    durationRow: "text-amber-900 font-serif italic",
    slotWhen: "text-amber-950 font-serif text-xl",
    slotTz: "text-amber-800/70",
    joinLink: "border-amber-800/20 text-amber-950 hover:bg-amber-100",
    section: "bg-[#faf8f3] p-10 font-serif text-amber-950",
    h2: "text-amber-950 text-5xl",
    lead: "text-amber-800/80 italic",
    label: "text-amber-950 font-bold",
    input: "rounded-none border-b-2 border-t-0 border-x-0 border-amber-900/20 bg-transparent text-amber-950 focus:border-amber-700 focus:ring-0",
    phoneInputClass:
      "!w-full !h-[42px] !rounded-none !border-b-2 !border-t-0 !border-x-0 !border-amber-900/20 !bg-transparent !pl-14 !text-sm !text-amber-950 focus:!border-amber-700 focus:!ring-0",
    phoneButtonClass: "!border-none !bg-transparent hover:!bg-amber-50",
    scheduleBtn: "rounded-none border-2 border-amber-900 bg-amber-900 text-[#faf6ef] px-12 py-4 font-bold uppercase tracking-widest hover:bg-amber-950 transition-all",
    confirmedWrap: "border-2 border-emerald-800/20 bg-emerald-50/50",
    confirmedTitle: "text-emerald-950 font-serif text-3xl",
    confirmedText: "text-emerald-900 italic",
  },
  modern: {
    pageWrap: "bg-slate-50",
    pageInner: "max-w-6xl",
    cardLayout: "md:grid-cols-[380px_1fr]",
    card: "overflow-hidden rounded-[40px] border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]",
    aside: "border-r border-slate-100 bg-gradient-to-b from-slate-50/50 to-white p-12",
    asideBorder: "border-slate-100",
    backBtn: "rounded-2xl border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-900 shadow-sm",
    hostName: "text-xs font-black uppercase tracking-[0.2em] text-violet-600/70",
    eventTitle: "text-5xl font-black tracking-tighter text-slate-900 leading-none",
    durationRow: "text-slate-500 font-bold",
    slotWhen: "text-slate-900 font-black text-xl tracking-tight",
    slotTz: "text-slate-400 font-bold",
    joinLink: "rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm",
    section: "bg-white p-12",
    h2: "text-slate-900 font-black text-5xl tracking-tighter",
    lead: "text-slate-400 font-bold text-lg",
    label: "text-slate-900 font-black text-xs uppercase tracking-widest",
    input: "rounded-[24px] border-slate-100 bg-slate-50/50 text-slate-900 focus:border-violet-500 focus:bg-white focus:ring-violet-100 p-4",
    phoneInputClass:
      "!w-full !h-[56px] !rounded-[24px] !border-slate-100 !bg-slate-50/50 !pl-16 !text-sm !font-bold !text-slate-900 focus:!border-violet-500 focus:!bg-white focus:!ring-4 focus:!ring-violet-100 transition-all",
    phoneButtonClass: "!rounded-l-[24px] !border-none !bg-transparent hover:!bg-slate-100 !pl-4",
    scheduleBtn: "rounded-[24px] bg-slate-900 p-6 text-white font-black uppercase tracking-widest hover:bg-black shadow-2xl shadow-slate-900/20 active:scale-95 transition-all",
    confirmedWrap: "rounded-[40px] border border-emerald-100 bg-emerald-50/30 p-8",
    confirmedTitle: "text-emerald-900 font-black text-3xl tracking-tight",
    confirmedText: "text-emerald-800 font-bold",
  },
  compact: {
    pageWrap: "bg-zinc-100/50",
    pageInner: "max-w-md",
    cardLayout: "grid-cols-1",
    card: "rounded-3xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]",
    aside: "border-b border-zinc-100 bg-zinc-50/50 p-8",
    asideBorder: "border-zinc-100",
    backBtn: "rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-white",
    hostName: "text-[10px] font-black uppercase tracking-widest text-zinc-400",
    eventTitle: "text-2xl font-black text-zinc-900 tracking-tight",
    durationRow: "text-sm font-bold text-zinc-500",
    slotWhen: "text-sm font-black text-zinc-900",
    slotTz: "text-[10px] font-bold text-zinc-400",
    joinLink: "rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold",
    section: "p-8",
    h2: "text-xl font-black text-zinc-900 tracking-tight",
    lead: "text-sm font-medium text-zinc-500",
    label: "text-[10px] font-black uppercase tracking-widest text-zinc-400",
    input: "rounded-xl border-zinc-100 bg-zinc-50 text-sm font-bold text-zinc-900 focus:border-zinc-300 focus:ring-0",
    phoneInputClass: phoneLight.replace("rounded-lg", "rounded-xl").replace("bg-white", "bg-zinc-50").replace("border-zinc-200", "border-zinc-100"),
    phoneButtonClass: phoneLightBtn.replace("rounded-lg", "rounded-xl").replace("bg-white", "bg-zinc-50"),
    scheduleBtn: "w-full rounded-xl bg-zinc-900 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-black shadow-lg",
    confirmedWrap: "rounded-2xl border border-emerald-100 bg-emerald-50",
    confirmedTitle: "text-lg font-black text-emerald-900",
    confirmedText: "text-sm font-bold text-emerald-800",
  },
  editorial: {
    pageWrap: "bg-white",
    pageInner: "max-w-7xl",
    cardLayout: "md:grid-cols-[400px_1fr]",
    card: "border-zinc-900 md:border-2 md:rounded-none shadow-[30px_30px_0_0_rgba(0,0,0,0.03)]",
    aside: "border-r-0 border-b-2 border-zinc-900 bg-white p-12 md:border-b-0 md:border-r-2 md:border-zinc-900",
    asideBorder: "border-zinc-900",
    backBtn: "rounded-none border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white font-black uppercase tracking-tighter",
    hostName: "text-xs font-black uppercase tracking-[0.4em] text-zinc-400",
    eventTitle: "font-serif text-6xl font-light text-zinc-950 md:text-7xl leading-[0.9]",
    durationRow: "text-lg font-black text-zinc-900 uppercase tracking-tighter",
    slotWhen: "font-serif text-2xl text-zinc-950 italic",
    slotTz: "text-sm font-bold text-zinc-400 uppercase tracking-widest",
    joinLink: "border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all",
    section: "bg-white p-12 md:p-16",
    h2: "font-serif text-7xl font-light tracking-tighter text-zinc-950 md:text-8xl leading-[0.85]",
    lead: "text-zinc-400 font-bold uppercase tracking-widest text-sm",
    label: "text-xs font-black uppercase tracking-[0.2em] text-zinc-900",
    input: "rounded-none border-2 border-zinc-900 bg-white text-zinc-900 font-bold focus:ring-4 focus:ring-zinc-100 p-4",
    phoneInputClass:
      "!w-full !h-[56px] !rounded-none !border-2 !border-zinc-900 !bg-white !pl-16 !text-sm !font-bold !text-zinc-900 focus:!ring-4 focus:!ring-zinc-100",
    phoneButtonClass: "!rounded-none !border-r-2 !border-zinc-900 !bg-white hover:!bg-zinc-100",
    scheduleBtn: "rounded-none border-2 border-zinc-900 bg-zinc-900 text-white px-16 py-6 text-lg font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all shadow-2xl shadow-zinc-200",
    confirmedWrap: "border-2 border-zinc-900 bg-zinc-50 p-10",
    confirmedTitle: "font-serif text-4xl text-zinc-950",
    confirmedText: "text-lg font-bold text-zinc-600",
  },
};

export function getTemplateShell(id: string | null | undefined): TemplateShell {
  return shells[normalizeBookingPageTemplate(id)];
}

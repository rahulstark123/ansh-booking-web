"use client";

import { useEffect, useMemo, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import {
  ChevronDownIcon,
  GlobeAltIcon,
  IdentificationIcon,
  InformationCircleIcon,
  LinkIcon,
  PhotoIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/ToastProvider";

const SETTINGS_ITEMS = [
  { id: "profile", label: "Profile", icon: IdentificationIcon },
  { id: "branding", label: "Branding", icon: PaintBrushIcon },
  { id: "my-link", label: "My Link", icon: LinkIcon },
  { id: "communication", label: "Communication settings", icon: GlobeAltIcon },
  { id: "security", label: "Security", icon: ShieldCheckIcon },
] as const;
type SettingsItemId = (typeof SETTINGS_ITEMS)[number]["id"];

const INITIAL_PROFILE = {
  name: "Rahul Raj",
  welcomeMessage: "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.",
  language: "English",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h (am/pm)",
  country: "India",
  timeZone: "Asia/Kolkata",
};

const INITIAL_BRANDING = {
  applyLogoToOrg: false,
  usePlatformBranding: true,
  applyBrandingToOrg: false,
};

const INITIAL_MY_LINK = {
  slug: "rahulraj9853045",
};

const INITIAL_COMMUNICATION = {
  emailWhenAddedToEventType: true,
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsItemId>("profile");

  const [name, setName] = useState(INITIAL_PROFILE.name);
  const [welcomeMessage, setWelcomeMessage] = useState(INITIAL_PROFILE.welcomeMessage);
  const [language, setLanguage] = useState(INITIAL_PROFILE.language);
  const [dateFormat, setDateFormat] = useState(INITIAL_PROFILE.dateFormat);
  const [timeFormat, setTimeFormat] = useState(INITIAL_PROFILE.timeFormat);
  const [country, setCountry] = useState(INITIAL_PROFILE.country);
  const [timeZone, setTimeZone] = useState(INITIAL_PROFILE.timeZone);
  const [currentTime, setCurrentTime] = useState("");
  const [applyLogoToOrg, setApplyLogoToOrg] = useState(INITIAL_BRANDING.applyLogoToOrg);
  const [usePlatformBranding, setUsePlatformBranding] = useState(INITIAL_BRANDING.usePlatformBranding);
  const [applyBrandingToOrg, setApplyBrandingToOrg] = useState(INITIAL_BRANDING.applyBrandingToOrg);
  const [myLinkSlug, setMyLinkSlug] = useState(INITIAL_MY_LINK.slug);

  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone,
      }).format(new Date());
      setCurrentTime(formatted.toLowerCase());
    };

    updateTime();
    const timer = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(timer);
  }, [timeZone]);

  const hasProfileChanges = useMemo(
    () =>
      name !== INITIAL_PROFILE.name ||
      welcomeMessage !== INITIAL_PROFILE.welcomeMessage ||
      language !== INITIAL_PROFILE.language ||
      dateFormat !== INITIAL_PROFILE.dateFormat ||
      timeFormat !== INITIAL_PROFILE.timeFormat ||
      country !== INITIAL_PROFILE.country ||
      timeZone !== INITIAL_PROFILE.timeZone,
    [country, dateFormat, language, name, timeFormat, timeZone, welcomeMessage],
  );

  const hasBrandingChanges = useMemo(
    () =>
      applyLogoToOrg !== INITIAL_BRANDING.applyLogoToOrg ||
      usePlatformBranding !== INITIAL_BRANDING.usePlatformBranding ||
      applyBrandingToOrg !== INITIAL_BRANDING.applyBrandingToOrg,
    [applyBrandingToOrg, applyLogoToOrg, usePlatformBranding],
  );

  const hasMyLinkChanges = useMemo(() => myLinkSlug !== INITIAL_MY_LINK.slug, [myLinkSlug]);

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    showToast({ kind: "success", title: "Profile updated", message: "Your profile settings were saved." });
  }

  function handleBrandingSave(e: FormEvent) {
    e.preventDefault();
    showToast({ kind: "success", title: "Branding updated", message: "Your branding settings were saved." });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-8 py-4"
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
        <div className="grid min-h-[600px] md:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="border-r border-zinc-100 bg-zinc-50/50 px-4 py-8">
            <h1 className="px-3 text-2xl font-black tracking-tight text-zinc-900">Settings</h1>

            <nav className="mt-8 space-y-1.5" aria-label="Settings navigation">
              {SETTINGS_ITEMS.map((item) => {
                const active = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={[
                      "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all active:scale-[0.98]",
                      active
                        ? "bg-white text-[var(--app-primary)] shadow-md shadow-zinc-200/50 ring-1 ring-zinc-200"
                        : "text-zinc-500 hover:bg-white hover:text-zinc-900"
                    ].join(" ")}
                  >
                    <Icon className={[
                      "h-5 w-5 shrink-0 transition-colors",
                      active ? "text-[var(--app-primary)]" : "text-zinc-400 group-hover:text-zinc-600"
                    ].join(" ")} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.div 
                        layoutId="activeTab"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--app-primary)]" 
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <section className="p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto w-full max-w-2xl"
              >
                {activeSection === "profile" && (
                  <>
                    <h2 className="text-xl font-black text-zinc-900">Personal Profile</h2>
                    <p className="mt-2 text-sm font-medium text-zinc-500">
                      Manage your public identity and regional preferences for booking pages.
                    </p>

                    <div className="mt-10 flex items-center gap-6 p-6 rounded-3xl bg-zinc-50 ring-1 ring-zinc-100">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-inner text-zinc-300">
                        <PhotoIcon className="h-10 w-10" />
                      </div>
                      <div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                        >
                          <CloudArrowUpIcon className="h-4 w-4" />
                          Update Photo
                        </button>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">JPG, PNG or GIF • Max 5MB</p>
                      </div>
                    </div>

                    <form className="mt-10 space-y-8" onSubmit={handleProfileSave}>
                      <Field label="Full Name">
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Raj" />
                      </Field>

                      <Field label="Bio / Welcome Message">
                        <textarea
                          value={welcomeMessage}
                          onChange={(e) => setWelcomeMessage(e.target.value)}
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary-soft)]"
                        />
                      </Field>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <Field label="Date Format">
                          <Select
                            value={dateFormat}
                            options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}
                            onChange={setDateFormat}
                          />
                        </Field>
                        <Field label="Time Format">
                          <Select value={timeFormat} options={["12h (am/pm)", "24h"]} onChange={setTimeFormat} />
                        </Field>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Time Zone</label>
                          <span className="text-xs font-bold text-zinc-900 bg-[var(--app-primary-soft)] px-2 py-0.5 rounded-lg tabular-nums">
                            {currentTime}
                          </span>
                        </div>
                        <Select
                          value={timeZone}
                          options={["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York"]}
                          labels={{
                            "Asia/Kolkata": "India Standard Time (IST)",
                            "Asia/Dubai": "Gulf Standard Time (GST)",
                            "Europe/London": "Greenwich Mean Time (GMT)",
                            "America/New_York": "Eastern Time (EST)",
                          }}
                          onChange={setTimeZone}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-8">
                        <button
                          type="button"
                          disabled={!hasProfileChanges}
                          className="px-6 py-2 text-sm font-bold text-zinc-400 transition hover:text-zinc-600 disabled:opacity-30"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={!hasProfileChanges}
                          className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                        >
                          Save Profile
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {activeSection === "branding" && (
                  <form onSubmit={handleBrandingSave} className="space-y-10">
                    <div>
                      <h2 className="text-xl font-black text-zinc-900">Custom Branding</h2>
                      <p className="mt-2 text-sm font-medium text-zinc-500">Customize the look and feel of your booking pages.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <h3 className="text-base font-bold text-zinc-900">Platform Branding</h3>
                        <p className="mt-2 text-sm font-medium text-zinc-500">Show ANSH product branding on scheduling pages and emails.</p>
                        
                        <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-zinc-50">
                          <span className="text-sm font-bold text-zinc-700">Display "Powered by ANSH"</span>
                          <button
                            type="button"
                            onClick={() => setUsePlatformBranding(!usePlatformBranding)}
                            className={[
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              usePlatformBranding ? "bg-[var(--app-primary)]" : "bg-zinc-300",
                            ].join(" ")}
                          >
                            <span className={[
                              "h-5 w-5 transform rounded-full bg-white transition-transform",
                              usePlatformBranding ? "translate-x-5" : "translate-x-1"
                            ].join(" ")} />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                        <h3 className="text-base font-bold text-zinc-900">Workspace Logo</h3>
                        <p className="mt-2 text-sm font-medium text-zinc-500">Your logo appears at the top of all booking links.</p>
                        
                        <div className="mt-8 flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          No Logo Uploaded
                        </div>
                        <button className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
                          Upload Workspace Logo
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-zinc-100 pt-8">
                      <button
                        type="submit"
                        disabled={!hasBrandingChanges}
                        className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                      >
                        Update Branding
                      </button>
                    </div>
                  </form>
                )}

                {activeSection === "my-link" && (
                  <div className="space-y-10">
                    <div>
                      <h2 className="text-xl font-black text-zinc-900">Personal Booking Link</h2>
                      <p className="mt-2 text-sm font-medium text-zinc-500">Changing your URL will break any existing links you have shared.</p>
                    </div>

                    <div className="group relative flex items-center gap-3 p-6 rounded-3xl bg-zinc-50 ring-1 ring-zinc-200 focus-within:ring-[var(--app-primary)] transition-all">
                      <LinkIcon className="h-6 w-6 text-zinc-400 group-focus-within:text-[var(--app-primary)]" />
                      <div className="flex flex-col flex-grow">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">anshbookings.com/</span>
                        <input
                          value={myLinkSlug}
                          onChange={(e) => setMyLinkSlug(e.target.value)}
                          className="bg-transparent text-lg font-extrabold text-zinc-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-8">
                      <button
                        disabled={!hasMyLinkChanges}
                        className="rounded-2xl bg-[var(--app-primary)] px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                      >
                        Save New URL
                      </button>
                    </div>
                  </div>
                )}
                
                {(activeSection === "communication" || activeSection === "security") && (
                   <div className="py-20 text-center">
                     <ShieldCheckIcon className="h-16 w-16 mx-auto text-zinc-200 mb-6" />
                     <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Advanced Settings Ready</h3>
                     <p className="mt-2 text-sm font-medium text-zinc-500">These configurations will be available in the next release.</p>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">{label}</label>
      {children}
    </div>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary-soft)] placeholder:text-zinc-300"
    />
  );
}

function Select({
  value,
  options,
  onChange,
  labels,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-3 pr-10 pl-4 text-sm font-medium text-zinc-900 shadow-sm outline-none transition-all focus:border-[var(--app-primary)] focus:ring-4 focus:ring-[var(--app-primary-soft)]"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {labels?.[item] ?? item}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-[var(--app-primary)] transition-colors" />
    </div>
  );
}

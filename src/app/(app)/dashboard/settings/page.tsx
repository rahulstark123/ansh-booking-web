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
} from "@heroicons/react/24/outline";
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
  const [emailWhenAddedToEventType, setEmailWhenAddedToEventType] = useState(INITIAL_COMMUNICATION.emailWhenAddedToEventType);

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

  const timeZoneLabel = useMemo(() => {
    if (timeZone === "Asia/Kolkata") return "India Standard Time";
    if (timeZone === "Asia/Dubai") return "Gulf Standard Time";
    if (timeZone === "Europe/London") return "Greenwich Mean Time";
    return "Eastern Time";
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

  function handleProfileCancel() {
    setName(INITIAL_PROFILE.name);
    setWelcomeMessage(INITIAL_PROFILE.welcomeMessage);
    setLanguage(INITIAL_PROFILE.language);
    setDateFormat(INITIAL_PROFILE.dateFormat);
    setTimeFormat(INITIAL_PROFILE.timeFormat);
    setCountry(INITIAL_PROFILE.country);
    setTimeZone(INITIAL_PROFILE.timeZone);
    showToast({ kind: "info", title: "Changes discarded", message: "Profile fields were reset." });
  }

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    showToast({ kind: "success", title: "Profile updated", message: "Your profile settings were saved." });
  }

  function handleBrandingCancel() {
    setApplyLogoToOrg(INITIAL_BRANDING.applyLogoToOrg);
    setUsePlatformBranding(INITIAL_BRANDING.usePlatformBranding);
    setApplyBrandingToOrg(INITIAL_BRANDING.applyBrandingToOrg);
    showToast({ kind: "info", title: "Changes discarded", message: "Branding fields were reset." });
  }

  function handleBrandingSave(e: FormEvent) {
    e.preventDefault();
    showToast({ kind: "success", title: "Branding updated", message: "Your branding settings were saved." });
  }

  function handleMyLinkSave(e: FormEvent) {
    e.preventDefault();
    showToast({ kind: "success", title: "Link updated", message: "Your public booking link was updated." });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid min-h-[540px] md:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-r border-zinc-200 px-4 py-5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Account settings</h1>

          <nav className="mt-5 space-y-1" aria-label="Settings navigation">
            {SETTINGS_ITEMS.map((item) => {
              const active = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)]"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="p-6 lg:p-8">
          {activeSection === "profile" && (
            <div className="mx-auto w-full max-w-2xl">
            <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Manage your account details, scheduling page identity, and regional preferences.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
                <PhotoIcon className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <button
                  type="button"
                  className="rounded-full border border-[var(--app-primary)] px-4 py-1.5 text-sm font-medium text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)]"
                >
                  Upload picture
                </button>
                <p className="mt-2 text-xs text-zinc-500">JPG, GIF or PNG. Max size of 5MB.</p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleProfileSave}>
              <Field label="Name" info>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>

              <Field label="Welcome Message" info>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                />
              </Field>

              <Field label="Language">
                <Select
                  value={language}
                  options={["English", "Hindi", "Spanish"]}
                  onChange={setLanguage}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Date Format" info>
                  <Select
                    value={dateFormat}
                    options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}
                    onChange={setDateFormat}
                  />
                </Field>
                <Field label="Time Format" info>
                  <Select value={timeFormat} options={["12h (am/pm)", "24h"]} onChange={setTimeFormat} />
                </Field>
              </div>

              <Field label="Country">
                <Select
                  value={country}
                  options={["India", "United Arab Emirates", "United Kingdom", "United States"]}
                  onChange={setCountry}
                />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-800">Time Zone</label>
                  <p className="text-sm text-zinc-700">
                    Current time: <span className="font-semibold text-zinc-900">{currentTime}</span>
                  </p>
                </div>
                <Select
                  value={timeZone}
                  options={["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York"]}
                  labels={{
                    "Asia/Kolkata": "India Standard Time",
                    "Asia/Dubai": "Gulf Standard Time",
                    "Europe/London": "Greenwich Mean Time",
                    "America/New_York": "Eastern Time (US & Canada)",
                  }}
                  onChange={setTimeZone}
                />
                <p className="mt-1 text-xs text-zinc-500">{timeZoneLabel}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-5">
                <button
                  type="button"
                  onClick={handleProfileCancel}
                  disabled={!hasProfileChanges}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasProfileChanges}
                  className="rounded-lg bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save changes
                </button>
              </div>
            </form>
            </div>
          )}

          {activeSection === "branding" && (
            <div className="mx-auto w-full max-w-2xl">
              <h2 className="text-lg font-semibold text-zinc-900">Branding</h2>
              <p className="mt-1 text-sm text-zinc-600">Customize the logo and branding experience for your booking pages.</p>

              <form className="mt-6 space-y-6" onSubmit={handleBrandingSave}>
                <div>
                  <Field label="Logo" info>
                    <p className="mb-3 text-sm text-zinc-600">
                      Your company branding appears at the top-left corner of the scheduling page.
                    </p>
                    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={applyLogoToOrg}
                        onChange={(e) => setApplyLogoToOrg(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-[var(--app-primary)] focus:ring-[var(--app-ring)]"
                      />
                      Apply to all users in your organization
                      <InformationCircleIcon className="h-4 w-4 text-zinc-400" aria-hidden />
                    </label>
                  </Field>

                  <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                    <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-lg font-semibold text-zinc-500">
                      No logo
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--app-primary)] px-4 py-1.5 text-sm font-medium text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)]"
                      >
                        Upload image
                      </button>
                      <p className="text-xs text-zinc-500">JPG, GIF or PNG. Max size of 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">Use ANSH branding</h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        Show product branding on your scheduling page, notifications, and confirmations.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={usePlatformBranding}
                      onClick={() => setUsePlatformBranding((prev) => !prev)}
                      className={[
                        "relative inline-flex h-6 w-11 items-center rounded-full transition",
                        usePlatformBranding ? "bg-[var(--app-primary)]" : "bg-zinc-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-block h-5 w-5 transform rounded-full bg-white transition",
                          usePlatformBranding ? "translate-x-5" : "translate-x-1",
                        ].join(" ")}
                      />
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={applyBrandingToOrg}
                      onChange={(e) => setApplyBrandingToOrg(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[var(--app-primary)] focus:ring-[var(--app-ring)]"
                    />
                    Apply to all users in your organization
                    <InformationCircleIcon className="h-4 w-4 text-zinc-400" aria-hidden />
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-5">
                  <button
                    type="button"
                    onClick={handleBrandingCancel}
                    disabled={!hasBrandingChanges}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasBrandingChanges}
                    className="rounded-lg bg-[var(--app-primary)] px-4 py-2 text-sm font-medium text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "my-link" && (
            <div className="mx-auto w-full max-w-2xl">
              <h2 className="text-lg font-semibold text-zinc-900">My link</h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-700">
                Changing your ANSH booking URL means your previously shared links may stop working and need to be updated.
              </p>

              <form className="mt-6" onSubmit={handleMyLinkSave}>
                <label htmlFor="my-link-slug" className="sr-only">
                  Booking link slug
                </label>
                <div className="flex w-full max-w-xl flex-wrap items-center gap-2 sm:flex-nowrap">
                  <span className="shrink-0 text-sm text-zinc-700">anshbookings.com/</span>
                  <input
                    id="my-link-slug"
                    value={myLinkSlug}
                    onChange={(e) => setMyLinkSlug(e.target.value.trimStart())}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
                  />
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    type="submit"
                    disabled={!hasMyLinkChanges}
                    className="rounded-full bg-[var(--app-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--app-primary-foreground)] transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "communication" && (
            <div className="mx-auto w-full max-w-2xl">
              <h2 className="text-lg font-semibold text-zinc-900">Communication settings</h2>

              <div className="mt-10">
                <p className="mb-2 text-base font-semibold text-zinc-900">Email notifications when added to event types</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailWhenAddedToEventType}
                    onClick={() => {
                      const next = !emailWhenAddedToEventType;
                      setEmailWhenAddedToEventType(next);
                      showToast({
                        kind: "success",
                        title: "Communication setting updated",
                        message: next ? "Email notification is now enabled." : "Email notification is now disabled.",
                      });
                    }}
                    className={[
                      "relative inline-flex h-6 w-11 items-center rounded-full transition",
                      emailWhenAddedToEventType ? "bg-[var(--app-primary)]" : "bg-zinc-300",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-block h-5 w-5 transform rounded-full bg-white transition",
                        emailWhenAddedToEventType ? "translate-x-5" : "translate-x-1",
                      ].join(" ")}
                    />
                  </button>
                  <p className="text-sm text-zinc-800">Receive an email when someone adds you as a host to an event type</p>
                </div>
              </div>

              <p className="mt-10 text-sm text-zinc-600">Your changes to this page are saved automatically.</p>
            </div>
          )}

          {activeSection !== "profile" &&
            activeSection !== "branding" &&
            activeSection !== "my-link" &&
            activeSection !== "communication" && (
            <div className="mx-auto w-full max-w-2xl">
              <h2 className="text-lg font-semibold text-zinc-900">
                {SETTINGS_ITEMS.find((item) => item.id === activeSection)?.label}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">This section is ready for the next set of settings.</p>
            </div>
          )}
        </section>
      </div>
      </div>

    </>
  );
}

function Field({
  label,
  info,
  children,
}: {
  label: string;
  info?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <label className="text-sm font-medium text-zinc-800">{label}</label>
        {info && <InformationCircleIcon className="h-4 w-4 text-zinc-400" aria-hidden />}
      </div>
      {children}
    </div>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
    />
  );
}

function Select({
  value,
  options,
  onChange,
  disabled,
  labels,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  labels?: Record<string, string>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pr-9 pl-3 text-sm text-zinc-900 outline-none transition disabled:cursor-not-allowed disabled:bg-zinc-50 focus:border-[var(--app-focus-border)] focus:ring-2 focus:ring-[var(--app-ring)]"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {labels?.[item] ?? item}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}

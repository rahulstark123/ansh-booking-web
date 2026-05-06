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
  TrashIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/ToastProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TimezoneSelect from "react-timezone-select";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

const SETTINGS_ITEMS = [
  { id: "profile", label: "Profile", icon: IdentificationIcon },
  { id: "branding", label: "Branding", icon: PaintBrushIcon },
  { id: "my-link", label: "My Link", icon: LinkIcon },
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

async function authorizedGetJson(url: string): Promise<Record<string, unknown>> {
  const client = await getSupabaseBrowserClient();
  if (!client) throw new Error("no_client");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("no_session");
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

async function authorizedPatchJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const client = await getSupabaseBrowserClient();
  if (!client) throw new Error("no_client");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error("no_session");
  const res = await fetch(url, {
    method: "PATCH",
    headers: { 
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [applyLogoToOrg, setApplyLogoToOrg] = useState(INITIAL_BRANDING.applyLogoToOrg);
  const [usePlatformBranding, setUsePlatformBranding] = useState(INITIAL_BRANDING.usePlatformBranding);
  const [applyBrandingToOrg, setApplyBrandingToOrg] = useState(INITIAL_BRANDING.applyBrandingToOrg);
  const [workspaceLogo, setWorkspaceLogo] = useState<string>("");
  const [myLinkSlug, setMyLinkSlug] = useState(INITIAL_MY_LINK.slug);

  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? "";

  const profileQ = useQuery({
    queryKey: ["settings", "profile", userId],
    queryFn: () => authorizedGetJson("/api/dashboard/settings/profile"),
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profileQ.data) {
      if (typeof profileQ.data.fullName === "string") setName(profileQ.data.fullName);
      if (typeof profileQ.data.welcomeMessage === "string") setWelcomeMessage(profileQ.data.welcomeMessage);
      if (typeof profileQ.data.dateFormat === "string") setDateFormat(profileQ.data.dateFormat);
      if (typeof profileQ.data.timeFormat === "string") setTimeFormat(profileQ.data.timeFormat);
      if (typeof profileQ.data.timeZone === "string") setTimeZone(profileQ.data.timeZone);
      if (typeof profileQ.data.avatarUrl === "string") setAvatarUrl(profileQ.data.avatarUrl);
    }
  }, [profileQ.data]);

  const profileMutation = useMutation({
    mutationFn: (data: any) => authorizedPatchJson("/api/dashboard/settings/profile", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "profile", userId], data);
      showToast({ kind: "success", title: "Profile updated", message: "Your profile settings were saved." });
    },
    onError: () => {
      showToast({ kind: "error", title: "Update failed", message: "Could not save profile settings." });
    },
  });

  const brandingQ = useQuery({
    queryKey: ["settings", "branding", userId],
    queryFn: () => authorizedGetJson("/api/dashboard/settings/branding"),
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (brandingQ.data) {
      if (typeof brandingQ.data.usePlatformBranding === "boolean") {
        setUsePlatformBranding(brandingQ.data.usePlatformBranding);
      }
      if (typeof brandingQ.data.workspaceLogo === "string") {
        setWorkspaceLogo(brandingQ.data.workspaceLogo);
      }
    }
  }, [brandingQ.data]);

  const brandingMutation = useMutation({
    mutationFn: (data: { usePlatformBranding: boolean; workspaceLogo: string }) =>
      authorizedPatchJson("/api/dashboard/settings/branding", data),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "branding", userId], data);
      showToast({ kind: "success", title: "Branding updated", message: "Your branding settings were saved." });
    },
    onError: () => {
      showToast({ kind: "error", title: "Update failed", message: "Could not save branding settings." });
    },
  });

  const mylinkQ = useQuery({
    queryKey: ["settings", "mylink", userId],
    queryFn: () => authorizedGetJson("/api/dashboard/settings/mylink"),
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (mylinkQ.data && typeof mylinkQ.data.linkSlug === "string") {
      setMyLinkSlug(mylinkQ.data.linkSlug);
    }
  }, [mylinkQ.data]);

  const mylinkMutation = useMutation({
    mutationFn: (data: { linkSlug: string }) => authorizedPatchJson("/api/dashboard/settings/mylink", data),
    onSuccess: (data: any) => {
      queryClient.setQueryData(["settings", "mylink", userId], data);
      showToast({ kind: "success", title: "URL updated", message: "Your personal link was saved." });
    },
    onError: (err: any) => {
      showToast({ kind: "error", title: "Update failed", message: err.message || "Could not save your link slug." });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const client = await getSupabaseBrowserClient();
      if (!client) throw new Error("No client");
      const { data: { user } } = await client.auth.getUser();
      if (!user?.email) throw new Error("User email not found");
      const { error } = await client.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showToast({ kind: "success", title: "Email sent", message: "Password reset instructions sent to your email." });
    },
    onError: (err: any) => {
      showToast({ kind: "error", title: "Failed to send", message: err.message || "Failed to send reset email." });
    },
  });

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
      name !== (profileQ.data?.fullName || INITIAL_PROFILE.name) ||
      welcomeMessage !== (profileQ.data?.welcomeMessage || INITIAL_PROFILE.welcomeMessage) ||
      dateFormat !== (profileQ.data?.dateFormat || INITIAL_PROFILE.dateFormat) ||
      timeFormat !== (profileQ.data?.timeFormat || INITIAL_PROFILE.timeFormat) ||
      timeZone !== (profileQ.data?.timeZone || INITIAL_PROFILE.timeZone) ||
      avatarUrl !== (profileQ.data?.avatarUrl || ""),
    [name, welcomeMessage, dateFormat, timeFormat, timeZone, avatarUrl, profileQ.data]
  );

  const hasBrandingChanges = useMemo(
    () =>
      applyLogoToOrg !== INITIAL_BRANDING.applyLogoToOrg ||
      usePlatformBranding !== (brandingQ.data?.usePlatformBranding ?? INITIAL_BRANDING.usePlatformBranding) ||
      workspaceLogo !== (brandingQ.data?.workspaceLogo ?? "") ||
      applyBrandingToOrg !== INITIAL_BRANDING.applyBrandingToOrg,
    [applyBrandingToOrg, applyLogoToOrg, usePlatformBranding, workspaceLogo, brandingQ.data],
  );

  const hasMyLinkChanges = useMemo(
    () => myLinkSlug !== (mylinkQ.data?.linkSlug || ""),
    [myLinkSlug, mylinkQ.data]
  );

  async function uploadImage(file: File, bucket: string): Promise<string> {
    if (file.size > 500 * 1024) throw new Error("File exceeds 500KB limit.");
    const client = await getSupabaseBrowserClient();
    if (!client) throw new Error("No client");
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const { error } = await client.storage.from(bucket).upload(fileName, file, { cacheControl: "3600", upsert: true });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    profileMutation.mutate({
      fullName: name,
      welcomeMessage,
      dateFormat,
      timeFormat,
      timeZone,
      avatarUrl,
    });
  }

  function handleBrandingSave(e: FormEvent) {
    e.preventDefault();
    brandingMutation.mutate({ usePlatformBranding, workspaceLogo });
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
                      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-inner text-zinc-300 overflow-hidden group">
                        {avatarUrl ? (
                          <>
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setAvatarUrl("")}
                                className="p-2 text-white hover:text-red-400 transition"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <PhotoIcon className="h-10 w-10" />
                        )}
                      </div>
                      <div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50">
                          <CloudArrowUpIcon className="h-4 w-4" />
                          {isUploadingAvatar ? "Uploading..." : "Update Photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setIsUploadingAvatar(true);
                                const url = await uploadImage(file, "avatars");
                                setAvatarUrl(url);
                                showToast({ kind: "success", title: "Success", message: "Profile picture uploaded." });
                              } catch (err: any) {
                                showToast({ kind: "error", title: "Upload failed", message: err.message });
                              } finally {
                                setIsUploadingAvatar(false);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">JPG, PNG or GIF • Max 500 KB</p>
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
                        <TimezoneSelect
                          value={timeZone}
                          onChange={(val) => setTimeZone(typeof val === "string" ? val : val.value)}
                          className="text-sm font-medium text-zinc-900"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-8">
                        <button
                          type="button"
                          disabled={!hasProfileChanges}
                          onClick={() => {
                            setName((profileQ.data?.fullName as string) || INITIAL_PROFILE.name);
                            setWelcomeMessage((profileQ.data?.welcomeMessage as string) || INITIAL_PROFILE.welcomeMessage);
                            setDateFormat((profileQ.data?.dateFormat as string) || INITIAL_PROFILE.dateFormat);
                            setTimeFormat((profileQ.data?.timeFormat as string) || INITIAL_PROFILE.timeFormat);
                            setTimeZone((profileQ.data?.timeZone as string) || INITIAL_PROFILE.timeZone);
                            setAvatarUrl((profileQ.data?.avatarUrl as string) || "");
                          }}
                          className="px-6 py-2 text-sm font-bold text-zinc-400 transition hover:text-zinc-600 disabled:opacity-30"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={!hasProfileChanges || profileMutation.isPending}
                          className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                        >
                          {profileMutation.isPending ? "Saving..." : "Save Profile"}
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
                        
                        <div className="mt-8 relative flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-400 uppercase tracking-widest overflow-hidden group">
                          {workspaceLogo ? (
                            <>
                              <img src={workspaceLogo} alt="Workspace Logo" className="h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setWorkspaceLogo("")}
                                  className="p-2 text-white hover:text-red-400 transition"
                                >
                                  <TrashIcon className="h-6 w-6" />
                                </button>
                              </div>
                            </>
                          ) : (
                             "No Logo Uploaded"
                          )}
                        </div>
                        <label className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-2xl bg-zinc-900 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
                          {isUploadingLogo ? "Uploading..." : workspaceLogo ? "Change Workspace Logo" : "Upload Workspace Logo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setIsUploadingLogo(true);
                                const url = await uploadImage(file, "avatars");
                                setWorkspaceLogo(url);
                                showToast({ kind: "success", title: "Success", message: "Workspace logo uploaded." });
                              } catch (err: any) {
                                showToast({ kind: "error", title: "Upload failed", message: err.message });
                              } finally {
                                setIsUploadingLogo(false);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-zinc-100 pt-8">
                      <button
                        type="submit"
                        disabled={!hasBrandingChanges || brandingMutation.isPending}
                        className="rounded-2xl bg-[var(--app-primary)] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                      >
                        {brandingMutation.isPending ? "Updating..." : "Update Branding"}
                      </button>
                    </div>
                  </form>
                )}

                {activeSection === "my-link" && (
                  <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); mylinkMutation.mutate({ linkSlug: myLinkSlug }); }}>
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
                          placeholder="e.g. rahul-raj"
                          className="bg-transparent text-lg font-extrabold text-zinc-900 outline-none w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-8">
                      <button
                        type="submit"
                        disabled={!hasMyLinkChanges || mylinkMutation.isPending}
                        className="rounded-2xl bg-[var(--app-primary)] px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[var(--app-primary-soft)] transition-all hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
                      >
                        {mylinkMutation.isPending ? "Saving..." : "Save New URL"}
                      </button>
                    </div>
                  </form>
                )}
                
                {activeSection === "security" && (
                   <div className="space-y-10">
                     <div>
                       <h2 className="text-xl font-black text-zinc-900">Security Settings</h2>
                       <p className="mt-2 text-sm font-medium text-zinc-500">Manage your account security and authentication methods.</p>
                     </div>

                     <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                       <h3 className="text-base font-bold text-zinc-900">Password Authentication</h3>
                       <p className="mt-2 text-sm font-medium text-zinc-500">Secure your account by updating your password regularly.</p>
                       
                       <button
                         onClick={() => resetPasswordMutation.mutate()}
                         disabled={resetPasswordMutation.isPending}
                         className="mt-6 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                       >
                         {resetPasswordMutation.isPending ? "Sending..." : "Send Password Reset Email"}
                       </button>
                     </div>
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

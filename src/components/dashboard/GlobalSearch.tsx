"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  CalendarIcon, 
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";

interface SearchResult {
  contacts: any[];
  meetings: any[];
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const client = await getSupabaseBrowserClient();
        const session = await client?.auth.getSession();
        const token = session?.data.session?.access_token;

        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`, {
          headers: {
            "x-user-id": user?.id || "",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setResults(data);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const flatResults = [
    ...(results?.contacts.map(c => ({ ...c, kind: 'contact' })) || []),
    ...(results?.meetings.map(m => ({ ...m, kind: 'meeting' })) || [])
  ];

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.kind === 'contact') {
      router.push(`/dashboard/contacts?id=${item.id}`);
    } else {
      router.push(`/dashboard/meetings?id=${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % (flatResults.length || 1));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % (flatResults.length || 1));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      handleSelect(flatResults[selectedIndex]);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-1 px-4 sm:px-0">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-7 sm:left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-2.5 px-10 h-[42px]" />
    </div>
  );

  return (
    <>
      {/* Search Trigger */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 px-4 sm:px-0">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute top-1/2 left-7 sm:left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <button
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 py-2.5 pr-3 pl-10 text-sm text-zinc-500 transition-all hover:border-[var(--app-primary)] hover:bg-white hover:shadow-sm sm:rounded-xl"
        >
          <span>Search meetings, contacts...</span>
          <kbd className="hidden items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 font-sans text-[10px] font-medium text-zinc-400 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Modal - Portaled to body to avoid parent stacking context issues */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-zinc-950/65 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
              >
                <div className="relative flex items-center border-b border-zinc-100 p-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What are you looking for?"
                    className="ml-3 flex-1 bg-transparent text-lg font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {!query && (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
                        <MagnifyingGlassIcon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-zinc-900">Global Search</p>
                      <p className="mt-1 text-xs text-zinc-500">Search across your entire workspace</p>
                    </div>
                  )}

                  {isLoading && (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-zinc-50" />
                      ))}
                    </div>
                  )}

                  {results && (
                    <div className="space-y-4 p-2">
                      {results.contacts.length > 0 && (
                        <section>
                          <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Contacts</h3>
                          <div className="space-y-1">
                            {results.contacts.map((contact, i) => {
                              const isSelected = selectedIndex === i;
                              return (
                                <button
                                  key={contact.id}
                                  onClick={() => handleSelect({ ...contact, kind: 'contact' })}
                                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                                    isSelected ? "bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary-soft-border)]" : "hover:bg-zinc-50"
                                  }`}
                                >
                                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                                    isSelected ? "bg-[var(--app-primary)] text-white" : "bg-zinc-100 text-zinc-500"
                                  }`}>
                                    {contact.name[0]}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-zinc-900">{contact.name}</p>
                                    <p className="truncate text-xs text-zinc-500">{contact.email}</p>
                                  </div>
                                  <UserIcon className="h-4 w-4 text-zinc-300" />
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {results.meetings.length > 0 && (
                        <section>
                          <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Meetings</h3>
                          <div className="space-y-1">
                            {results.meetings.map((meeting, i) => {
                              const isSelected = selectedIndex === (results.contacts.length + i);
                              return (
                                <button
                                  key={meeting.id}
                                  onClick={() => handleSelect({ ...meeting, kind: 'meeting' })}
                                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                                    isSelected ? "bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary-soft-border)]" : "hover:bg-zinc-50"
                                  }`}
                                >
                                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    isSelected ? "bg-[var(--app-primary-soft)] text-[var(--app-primary)]" : "bg-zinc-100 text-zinc-400"
                                  }`}>
                                    <CalendarIcon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-zinc-900">{meeting.title}</p>
                                    <p className="truncate text-xs text-zinc-500">{meeting.subtitle}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-zinc-400">
                                      {new Date(meeting.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {results.contacts.length === 0 && results.meetings.length === 0 && (
                        <div className="p-8 text-center text-sm text-zinc-500">
                          No results found for "{query}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 p-3 px-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-sm">↵</kbd>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Select</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-sm">↑</kbd>
                        <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-sm">↓</kbd>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Navigate</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Press <kbd className="text-zinc-900">ESC</kbd> to close</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

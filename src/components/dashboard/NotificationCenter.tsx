"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BellIcon, 
  XMarkIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserPlusIcon,
  SparklesIcon,
  InboxIcon
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/stores/auth-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => setMounted(true), []);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const client = await getSupabaseBrowserClient();
      const session = await client?.auth.getSession();
      const token = session?.data.session?.access_token;

      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const client = await getSupabaseBrowserClient();
      const session = await client?.auth.getSession();
      const token = session?.data.session?.access_token;

      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to mark notifications read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabaseBrowserClient();
      const session = await client?.auth.getSession();
      const token = session?.data.session?.access_token;

      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to mark notification read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "booking": return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case "slot": return <SparklesIcon className="h-5 w-5 text-amber-500" />;
      case "contact": return <UserPlusIcon className="h-5 w-5 text-emerald-500" />;
      default: return <BellIcon className="h-5 w-5 text-zinc-400" />;
    }
  };

  if (!mounted) return (
    <button className="relative h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500">
      <BellIcon className="h-[17px] w-[17px]" />
    </button>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-[var(--app-row-hover)] hover:text-zinc-800"
      >
        <BellIcon className="h-[17px] w-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 p-6 px-8">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-zinc-900">Notifications</h2>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllReadMutation.mutate()}
                        className="rounded-full bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-100"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-zinc-50 p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  {notifications.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-50 text-zinc-300">
                        <InboxIcon className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold text-zinc-900">No notifications yet</p>
                      <p className="mt-1 text-xs text-zinc-500">We'll notify you here when important things happen in your workspace.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (!notification.isRead) markReadMutation.mutate(notification.id);
                            // If there's a link, navigate? (For now just mark read)
                          }}
                          className={`group relative flex gap-4 rounded-3xl p-4 transition-all cursor-pointer ${
                            notification.isRead 
                              ? "bg-white hover:bg-zinc-50" 
                              : "bg-[var(--app-primary-soft)] ring-1 ring-[var(--app-primary-soft-border)]"
                          }`}
                        >
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                            notification.isRead ? "bg-zinc-50" : "bg-white shadow-sm"
                          }`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="min-w-0 flex-1 pr-4">
                            <div className="flex items-start justify-between">
                              <h4 className={`truncate text-sm font-bold ${notification.isRead ? "text-zinc-900" : "text-[var(--app-primary)]"}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap ml-2">
                                {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[var(--app-primary)]" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 px-8">
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Real-time workspace activity
                  </p>
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

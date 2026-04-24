"use client";

import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { useDashboardActivity, useDashboardAgenda, useDashboardOverview } from "@/hooks/use-dashboard-queries";
import { useAuthStore } from "@/stores/auth-store";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function ActivityIcon({ type }: { type: "payment" | "inquiry" | "reschedule" }) {
  if (type === "payment") return <CheckCircleIcon className="h-5 w-5 text-emerald-500" aria-hidden />;
  if (type === "inquiry") return <EnvelopeIcon className="h-5 w-5 text-blue-500" aria-hidden />;
  return <ExclamationCircleIcon className="h-5 w-5 text-amber-500" aria-hidden />;
}

export function DashboardHomeContent() {
  const user = useAuthStore((s) => s.user);
  const first = user?.name.split(" ")[0] ?? "there";

  const overview = useDashboardOverview();
  const agenda = useDashboardAgenda();
  const activity = useDashboardActivity();

  const o = overview.data;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <motion.div 
      className="mx-auto max-w-6xl space-y-10 py-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {greeting()}, {first}
          </h1>
          {o && (
            <p className="mt-3 max-w-2xl text-lg text-zinc-500 leading-relaxed">
              Your schedule is <span className="font-semibold text-zinc-900 tabular-nums">{o.scheduleFillPct}%</span> full today.{" "}
              <span className="font-semibold text-zinc-900 tabular-nums">{o.pendingRequests} requests</span> need your attention.
            </p>
          )}
          {overview.isLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
              Syncing your workspace data...
            </div>
          )}
        </div>
        
        <Link 
          href="/dashboard/scheduling" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold shadow-lg shadow-zinc-200 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
        >
          <CalendarIcon className="w-4 h-4" />
          Set Availability
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-3">
        <KpiCard
          label="Total Bookings"
          value={o?.bookingsTotal.toLocaleString() ?? "—"}
          delta={`+${o?.bookingsDeltaPct ?? 0}%`}
          trend="up"
          icon={<CalendarIcon className="w-6 h-6" />}
          loading={overview.isLoading}
          color="primary"
        />
        <KpiCard
          label="Net Revenue"
          value={o ? `₹${o.revenueUsd.toLocaleString("en-IN")}` : "—"}
          delta={`+${o?.revenueDeltaPct ?? 0}%`}
          trend="up"
          icon={<CurrencyRupeeIcon className="w-6 h-6" />}
          loading={overview.isLoading}
          color="blue"
        />
        <KpiCard
          label="New Clients"
          value={o?.newClients.toString() ?? "—"}
          delta="New"
          trend="neutral"
          icon={<UserGroupIcon className="w-6 h-6" />}
          loading={overview.isLoading}
          color="indigo"
        />
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,360px)]">
        <motion.section variants={itemVariants} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--app-primary-soft)] rounded-lg">
                <ClockIcon className="w-5 h-5 text-[var(--app-primary)]" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900">Today&apos;s Agenda</h2>
            </div>
            <Link
              href="/dashboard/meetings"
              className="text-sm font-semibold text-[var(--app-primary)] hover:text-[var(--app-primary-hover)] transition-colors inline-flex items-center gap-1 group"
            >
              Full Schedule
              <ArrowUpRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          
          <div className="relative space-y-1">
            {/* Timeline Line */}
            <div className="absolute left-[39px] top-2 bottom-2 w-px bg-zinc-100 hidden sm:block" />
            
            <ul className="space-y-6 relative z-10">
              {agenda.isLoading &&
                [1, 2].map((i) => (
                  <li key={i} className="flex gap-6">
                    <div className="w-16 h-4 animate-pulse rounded bg-zinc-100 mt-1" />
                    <div className="flex-1 bg-zinc-50 h-24 rounded-xl animate-pulse" />
                  </li>
                ))}
              
              {agenda.data?.length === 0 && (
                <div className="py-12 text-center text-zinc-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-zinc-200" />
                  <p>Your agenda is clear for today.</p>
                </div>
              )}

              {agenda.data?.map((item) => (
                <li key={item.id} className="group relative flex items-start gap-6">
                  <span className="w-16 shrink-0 pt-3 text-xs font-bold tabular-nums text-zinc-400 group-hover:text-[var(--app-primary)] transition-colors uppercase tracking-tight">
                    {item.time}
                  </span>
                  
                  <div className="relative flex-1 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-all hover:border-[var(--app-primary-soft-border)] hover:shadow-md hover:shadow-[var(--app-ring)]">
                    <div className="absolute left-[-31px] top-4 hidden sm:flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 border-white bg-zinc-200 ring-4 ring-white group-hover:bg-[var(--app-primary)] group-hover:ring-[var(--app-primary-soft)] transition-all" />
                    
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 group-hover:text-[var(--app-primary)] transition-colors">{item.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">{item.client}</span>
                          <span className="text-zinc-300">·</span>
                          <span>{item.duration}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--app-primary-soft)] text-[var(--app-primary-soft-text)] rounded-lg text-xs font-bold transition-all hover:bg-[var(--app-primary-soft-border)] active:scale-95">
                          Start Meeting
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-zinc-50 hover:text-zinc-700"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.section variants={itemVariants} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Recent Activity</h2>
              <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-wider">
                Clear all
              </button>
            </div>
            
            <ul className="space-y-6">
              {activity.isLoading &&
                [1, 2, 3].map((i) => (
                  <li key={i} className="flex gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded-md bg-zinc-50" />
                    </div>
                  </li>
                ))}
              
              {activity.data?.map((item) => (
                <li key={item.id} className="group flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 shadow-sm transition-all group-hover:border-zinc-200 group-hover:scale-105 group-hover:rotate-3">
                    <ActivityIcon type={item.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 leading-tight">{item.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">{item.subtitle}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                      <ClockIcon className="w-3 h-3" />
                      {item.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.div 
            variants={itemVariants}
            className="group relative overflow-hidden rounded-2xl bg-zinc-900 p-6 shadow-xl"
          >
            {/* Animated background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--app-primary)] opacity-10 rounded-full blur-[40px] group-hover:opacity-20 transition-all duration-700" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 opacity-10 rounded-full blur-[40px] group-hover:opacity-20 transition-all duration-700 delay-150" />
            
            <div className="relative z-10">
              <div className="inline-flex p-2 bg-zinc-800 rounded-lg mb-4 ring-1 ring-zinc-700">
                <RocketLaunchIcon className="w-5 h-5 text-[var(--app-primary-soft-border)]" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Upgrade to Elite</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 font-medium">
                Unlock advanced routing, custom branding, and detailed analytics.
              </p>
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-bold text-zinc-900 shadow-lg transition-all hover:bg-zinc-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                View Elite Plans
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  icon,
  loading,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  loading: boolean;
  color: "primary" | "blue" | "indigo";
}) {
  const colorStyles = {
    primary: "bg-[var(--app-primary-soft)] text-[var(--app-primary)]",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="group relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl transition-all group-hover:scale-110 group-hover:rotate-3 ${colorStyles[color]}`}>
          {icon}
        </div>
        {loading ? (
          <div className="h-5 w-12 animate-pulse rounded bg-zinc-100" />
        ) : (
          <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold tracking-tight uppercase ${
            trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500"
          }`}>
            {delta}
          </span>
        )}
      </div>
      
      <div className="mt-6">
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="mt-2 h-9 w-28 animate-pulse rounded-lg bg-zinc-100" />
        ) : (
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900 tabular-nums">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

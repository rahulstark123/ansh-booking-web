"use client";

import {
  CheckCircleIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { useDashboardActivity, useDashboardAgenda, useDashboardOverview } from "@/hooks/use-dashboard-queries";
import { useAuthStore } from "@/stores/auth-store";

function ActivityIcon({ type }: { type: "payment" | "inquiry" | "reschedule" }) {
  if (type === "payment") return <CheckCircleIcon className="h-4 w-4 text-emerald-600" aria-hidden />;
  if (type === "inquiry") return <EnvelopeIcon className="h-4 w-4 text-[var(--app-primary)]" aria-hidden />;
  return <ExclamationCircleIcon className="h-4 w-4 text-amber-600" aria-hidden />;
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
          {greeting()}, {first}
        </h1>
        {o && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
            Your schedule is <span className="font-medium text-zinc-900 tabular-nums">{o.scheduleFillPct}%</span> full today.{" "}
            <span className="font-medium text-zinc-900 tabular-nums">{o.pendingRequests} requests</span> need a response.
          </p>
        )}
        {overview.isLoading && <p className="mt-2 text-sm text-zinc-500">Loading summary…</p>}
        {overview.isError && (
          <p className="mt-2 text-sm text-red-600">Could not load dashboard summary. Try again later.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total bookings"
          value={o?.bookingsTotal.toLocaleString() ?? "—"}
          badge={`+${o?.bookingsDeltaPct ?? 0}%`}
          badgeClass="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
          loading={overview.isLoading}
        />
        <KpiCard
          label="Revenue"
          value={o ? `₹${o.revenueUsd.toLocaleString("en-IN")}` : "—"}
          badge={`+${o?.revenueDeltaPct ?? 0}%`}
          badgeClass="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"
          loading={overview.isLoading}
        />
        <KpiCard
          label="New clients"
          value={o?.newClients.toString() ?? "—"}
          badge="New"
          badgeClass="bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200"
          loading={overview.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,320px)]">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900">Today&apos;s agenda</h2>
            <Link
              href="/dashboard/meetings"
              className="text-sm font-medium text-[var(--app-primary)] transition hover:text-[var(--app-primary-hover)]"
            >
              Meetings
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100">
            {agenda.isLoading &&
              [1, 2, 3].map((i) => (
                <li key={i} className="flex gap-4 py-4 first:pt-0">
                  <div className="h-10 w-16 animate-pulse rounded-md bg-zinc-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-pulse rounded-md bg-zinc-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded-md bg-zinc-50" />
                  </div>
                </li>
              ))}
            {agenda.data?.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0">
                <span className="w-[4.5rem] shrink-0 text-sm font-medium tabular-nums text-[var(--app-primary)]">{item.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-500">
                    {item.client} · {item.duration}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                  aria-label="More options"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recent activity</h2>
            <ul className="space-y-4">
              {activity.isLoading &&
                [1, 2, 3].map((i) => (
                  <li key={i} className="flex gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded-md bg-zinc-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded-md bg-zinc-50" />
                    </div>
                  </li>
                ))}
              {activity.data?.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                    <ActivityIcon type={item.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900">{item.title}</p>
                    <p className="text-sm text-zinc-500">{item.subtitle}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-[var(--app-primary-soft)] to-white p-5 shadow-sm ring-1 ring-[var(--app-primary-soft-border)]">
            <h3 className="text-sm font-semibold text-zinc-900">Upgrade to Elite</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
              Follow-ups, routing, and analytics in one place.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[var(--app-primary)] py-2.5 text-sm font-medium text-[var(--app-primary-foreground)] shadow-sm transition hover:bg-[var(--app-primary-hover)]"
            >
              View plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  badge,
  badgeClass,
  loading,
}: {
  label: string;
  value: string;
  badge: string;
  badgeClass: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded-md bg-zinc-100" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      )}
      <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}>{badge}</span>
    </div>
  );
}

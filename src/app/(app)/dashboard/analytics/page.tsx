"use client";

import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Presentation,
  PieChart as PieChartIcon,
  ArrowUpRight,
  CalendarDays,
  UserPlus,
  RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAdvancedAnalytics } from "@/hooks/use-analytics";

const COLORS = ["#3395FF", "#10B981", "#6366F1", "#F59E0B"];

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAdvancedAnalytics();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCcw className="w-8 h-8 text-[var(--app-primary)] animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Generating your insights...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <BarChart3 className="w-12 h-12" />
        </div>
        <p className="text-zinc-900 font-bold">Failed to load analytics</p>
        <button 
          onClick={() => refetch()}
          className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Advanced Analytics</h1>
          <p className="mt-2 text-zinc-500 max-w-2xl font-medium">
            Deep-dive into your workspace performance. Track revenue growth, booking patterns, and client acquisition metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest ring-1 ring-emerald-200">
            Pro Plan Active
          </div>
          <button 
            onClick={() => refetch()}
            className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-95"
          >
            <RefreshCcw className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsKpiCard 
          label="Conversion Rate" 
          value="18.4%" 
          delta="+2.4%" 
          icon={<ArrowUpRight className="w-5 h-5" />} 
          color="blue"
        />
        <AnalyticsKpiCard 
          label="Avg. Session Length" 
          value="42 min" 
          delta="-5 min" 
          icon={<CalendarDays className="w-5 h-5" />} 
          color="emerald"
        />
        <AnalyticsKpiCard 
          label="Client Retention" 
          value="92%" 
          delta="+1.2%" 
          icon={<UserPlus className="w-5 h-5" />} 
          color="indigo"
        />
        <AnalyticsKpiCard 
          label="Projected Revenue" 
          value="₹84,200" 
          delta="+15%" 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Presentation className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Revenue Growth</h2>
            </div>
            <select className="bg-zinc-50 border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3395FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3395FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3395FF" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Client Growth Chart */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Client Acquisition</h2>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Bar 
                  dataKey="clients" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Booking Distribution */}
        <section className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Booking Distribution</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.bookingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {data?.bookingDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {data?.bookingDistribution.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-bold text-zinc-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-zinc-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AnalyticsKpiCard({ 
  label, 
  value, 
  delta, 
  icon, 
  color 
}: { 
  label: string; 
  value: string; 
  delta: string; 
  icon: React.ReactNode;
  color: "blue" | "emerald" | "indigo" | "amber";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="group relative rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:shadow-zinc-100 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl transition-all group-hover:scale-110 group-hover:rotate-3 ${styles[color]}`}>
          {icon}
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
          delta.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {delta}
        </span>
      </div>
      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-zinc-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

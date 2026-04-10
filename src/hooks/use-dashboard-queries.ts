"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchActivity,
  fetchAgenda,
  fetchDashboardOverview,
} from "@/lib/dashboard-api";
import { queryKeys } from "@/lib/query-keys";

const stale = 60 * 1000;

export function useDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: fetchDashboardOverview,
    staleTime: stale,
  });
}

export function useDashboardAgenda() {
  return useQuery({
    queryKey: queryKeys.dashboard.agenda(),
    queryFn: fetchAgenda,
    staleTime: stale,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn: fetchActivity,
    staleTime: stale,
  });
}

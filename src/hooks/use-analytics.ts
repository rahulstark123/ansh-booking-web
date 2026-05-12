"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdvancedAnalytics } from "@/lib/dashboard-api";
import { queryKeys } from "@/lib/query-keys";

export function useAdvancedAnalytics() {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics(),
    queryFn: fetchAdvancedAnalytics,
    staleTime: 5 * 60 * 1000,
  });
}

"use client"

import { useQuery } from "@tanstack/react-query"
import { repo } from "@/lib/data"
import type { Granularity } from "@/lib/types"

function fromISOFor(granularity: Granularity) {
  const now = new Date()
  if (granularity === "semana") now.setDate(now.getDate() - 12 * 7)
  else now.setMonth(now.getMonth() - 6)
  return now.toISOString()
}

export function useMetricas(granularity: Granularity) {
  const fromISO = fromISOFor(granularity)
  const summary = useQuery({
    queryKey: ["metricas", "summary", fromISO],
    queryFn: () => repo.getMetricSummary(fromISO),
    staleTime: 1000 * 60 * 2,
  })
  const series = useQuery({
    queryKey: ["metricas", "series", granularity, fromISO],
    queryFn: () => repo.getMetricSeries(granularity, fromISO),
    staleTime: 1000 * 60 * 2,
  })
  return { summary, series, fromISO }
}
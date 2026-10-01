"use client"

import { motion } from "framer-motion"
import { CATEGORY_META } from "@/lib/constants"
import type { MetricPoint } from "@/lib/types"

export function BarChart({
  data,
  granularity,
}: {
  data: MetricPoint[]
  granularity: "semana" | "mes"
}) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.cafeteria, d.aseo))
  )

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META.cafeteria.color }} />
          Cafetería
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META.aseo.color }} />
          Aseo
        </span>
      </div>

      <div className="flex h-52 items-end gap-2">
        {data.length === 0 && (
          <p className="self-center text-sm text-muted-foreground">
            Sin datos confirmados en el período.
          </p>
        )}
        {data.map((point, i) => {
          const hCaf = Math.max(4, (point.cafeteria / max) * 100)
          const hAse = Math.max(4, (point.aseo / max) * 100)
          return (
            <div key={point.period} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-44 w-full items-end justify-center gap-1 rounded-xl bg-ani-surface-container-low/60 px-1 pt-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${hCaf}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  className="w-2.5 rounded-full sm:w-3"
                  style={{ backgroundColor: CATEGORY_META.cafeteria.color }}
                  title={`${point.period}: ${point.cafeteria} café`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${hAse}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04 + 0.05 }}
                  className="w-2.5 rounded-full sm:w-3"
                  style={{ backgroundColor: CATEGORY_META.aseo.color }}
                  title={`${point.period}: ${point.aseo} aseo`}
                />
              </div>
              <span className="max-w-full truncate text-[10px] font-semibold text-muted-foreground">
                {formatPeriod(point.period, granularity)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatPeriod(key: string, granularity: "semana" | "mes") {
  if (granularity === "mes") {
    const [, mm] = key.split("-").map(Number)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    return months[(mm ?? 1) - 1] ?? key
  }
  const [y, w] = key.split("-W")
  return `S${w} ${y?.slice(2)}`
}
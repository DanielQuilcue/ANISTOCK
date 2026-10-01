"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

export function MetricCard({
  icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  icon: ReactNode
  label: string
  value: string
  sub?: string
  accent: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl bg-white p-4 ring-1 ring-border/70 shadow-[0_1px_2px_rgba(23,41,62,0.04)]"
    >
      <div className="flex items-center justify-between">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[26px] leading-none font-extrabold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-muted-foreground">{label}</p>
      {sub && (
        <p className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
          {sub}
        </p>
      )}
    </motion.div>
  )
}
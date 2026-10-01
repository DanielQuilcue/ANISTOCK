"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
  count?: number
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-ani-surface-container-low p-1 ring-1 ring-border/60",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            {opt.icon && <span className="relative z-10 inline-flex">{opt.icon}</span>}
            <span className="relative z-10">{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className="relative z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums"
                style={{
                  backgroundColor: active ? "var(--ani-primary)" : "var(--ani-surface-container-high)",
                  color: active ? "#fff" : "var(--ani-on-surface-variant)",
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
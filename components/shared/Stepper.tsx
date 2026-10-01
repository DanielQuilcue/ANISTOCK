"use client"

import { Minus, Plus } from "lucide-react"

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-full bg-white p-1 ring-1 ring-border/70 sm:p-0.5">
      <button
        type="button"
        aria-label="Restar"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-ani-surface-container hover:text-foreground active:bg-ani-surface-container-high disabled:pointer-events-none disabled:opacity-30 sm:size-8"
      >
        <Minus className="size-5 sm:size-3.5" />
      </button>
      <span
        className="w-10 text-center text-base font-bold tabular-nums sm:w-8 sm:text-sm"
        style={{ color: value > 0 ? "var(--ani-primary)" : "var(--ani-on-surface-variant)" }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Sumar"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-11 place-items-center rounded-full text-white transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:size-8"
        style={{ backgroundColor: "var(--ani-primary)", color: "var(--ani-on-primary)" }}
      >
        <Plus className="size-5 sm:size-3.5" />
      </button>
    </div>
  )
}
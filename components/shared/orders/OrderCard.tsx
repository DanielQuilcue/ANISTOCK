"use client"

import type { Order } from "@/lib/types"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CategoryPill } from "@/components/shared/CategoryPill"
import { cn } from "@/lib/utils"

const CAT_ACCENT: Record<string, string> = {
  cafeteria: "#825100",
  aseo: "#0284c7",
}

export function OrderCard({
  order,
  onClick,
  selected,
}: {
  order: Order
  onClick?: () => void
  selected?: boolean
}) {
  const items = order.items ?? []
  const total = items.reduce((a, b) => a + b.quantity, 0)
  const cats = [...new Set(items.map((i) => i.category))]
  const accent = cats.length === 1 ? CAT_ACCENT[cats[0]] : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl bg-white p-4 text-left ring-1 ring-border/70 shadow-[0_1px_2px_rgba(23,41,62,0.05)] transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-ani-primary/40",
        selected && "ring-2 ring-ani-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-white"
              style={{ backgroundColor: accent ?? "var(--ani-primary)" }}
            >
              {initials(order.solicitante_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{order.solicitante_name}</p>
              <p className="text-xs text-muted-foreground">
                {order.piso} · {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {cats.map((c) => (
          <CategoryPill key={c} category={c} />
        ))}
        <span className="ml-auto text-sm font-extrabold tabular-nums">
          {total}{" "}
          <span className="text-xs font-semibold text-muted-foreground">
            {total === 1 ? "unidad" : "unidades"}
          </span>
        </span>
      </div>

      {order.comments && (
        <p className="mt-2 line-clamp-2 rounded-lg bg-ani-surface-container-low px-3 py-2 text-xs text-muted-foreground">
          “{order.comments}”
        </p>
      )}
    </button>
  )
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?"
  )
}

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
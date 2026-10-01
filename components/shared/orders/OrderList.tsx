"use client"

import { useState } from "react"
import type { Order, OrderStatus } from "@/lib/types"
import { OrderCard } from "@/components/shared/orders/OrderCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { Segmented } from "@/components/shared/Segmented"

const STATUS_OPTIONS: { value: OrderStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "entregado", label: "Entregados" },
]

export function OrderList({
  orders,
  loading,
  onSelect,
  selectedId,
  grid = true,
  cardAction,
}: {
  orders?: Order[]
  loading?: boolean
  onSelect?: (o: Order) => void
  selectedId?: string | null
  grid?: boolean
  cardAction?: (o: Order) => React.ReactNode
}) {
  const [status, setStatus] = useState<OrderStatus | "todos">("todos")

  const counts = useMemoCounts(orders)
  const filtered =
    orders?.filter((o) => status === "todos" || o.status === status) ?? []

  return (
    <div className="space-y-4">
      <Segmented
        options={STATUS_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
          count: o.value === "todos" ? undefined : counts[o.value],
        }))}
        value={status}
        onChange={setStatus}
        className="w-full"
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-ani-surface-container-low"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay pedidos"
          description="Aún no hay pedidos con este estado."
        />
      ) : (
        <div
          className={
            grid && !cardAction
              ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filtered.map((o) => (
            <div key={o.id}>
              <OrderCard
                order={o}
                onClick={onSelect ? () => onSelect(o) : undefined}
                selected={selectedId === o.id}
              />
              {cardAction?.(o)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function useMemoCounts(orders?: Order[]) {
  const counts: Record<OrderStatus, number> = {
    pendiente: 0,
    aprobado: 0,
    rechazado: 0,
    entregado: 0,
  }
  for (const o of orders ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1
  return counts
}
"use client"

import { useState } from "react"
import {
  useOrdenes,
  useActualizarEstado,
} from "@/features/pedidos/hooks"
import { useAuth } from "@/providers/AuthProvider"
import { OrderList } from "@/components/shared/orders/OrderList"
import { OrderDetailDialog } from "@/components/shared/orders/OrderDetailDialog"
import { PageHeader } from "@/components/shared/PageHeader"
import type { Order } from "@/lib/types"

export default function AprobacionesPanel() {
  const { profile } = useAuth()
  const { data: pendientes, isLoading } = useOrdenes({ status: "pendiente" })
  const actualizar = useActualizarEstado()
  const [selected, setSelected] = useState<Order | null>(null)

  const total = pendientes?.length ?? 0
  const busy = actualizar.isPending

  function decide(order: Order, status: "aprobado" | "rechazado", comments?: string) {
    void actualizar.mutateAsync({
      id: order.id,
      status,
      opts: {
        supervisorId: profile?.id ?? null,
        supervisorName: profile?.full_name ?? null,
        comments: comments || null,
      },
    })
    if (selected?.id === order.id) setSelected(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Supervisor"
        title="Aprobaciones"
        description="Valida que el contenido exista en el almacén antes de aprobar. La aprobación registra tu nombre como responsable."
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-ani-tertiary-container px-3.5 py-1.5 text-sm font-extrabold text-ani-tertiary">
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            {total} pendiente{total !== 1 && "s"}
          </span>
        }
      />

      <OrderList
        orders={pendientes}
        loading={isLoading}
        onSelect={setSelected}
        selectedId={selected?.id}
        grid={false}
        cardAction={(o) => (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(o, "rechazado")}
              className="flex h-[3.4rem] items-center justify-center gap-1.5 rounded-xl border border-destructive/30 text-base font-bold text-destructive transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
              Rechazar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(o, "aprobado")}
              className="flex h-[3.4rem] items-center justify-center gap-1.5 rounded-xl bg-ani-primary text-base font-bold text-white shadow-md shadow-ani-primary/20 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[22px]">check</span>
              Aprobar
            </button>
          </div>
        )}
      />

      <OrderDetailDialog
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        order={selected}
        actions={{
          canDecide: profile?.role === "supervisor",
          busy,
          onApprove: (c) => selected && decide(selected, "aprobado", c),
          onReject: (c) => selected && decide(selected, "rechazado", c),
        }}
      />
    </div>
  )
}
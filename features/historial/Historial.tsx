"use client"

import { useState } from "react"
import { useOrdenes, useActualizarEstado } from "@/features/pedidos/hooks"
import { useAuth } from "@/providers/AuthProvider"
import { OrderList } from "@/components/shared/orders/OrderList"
import { OrderDetailDialog } from "@/components/shared/orders/OrderDetailDialog"
import { PageHeader } from "@/components/shared/PageHeader"
import type { Order } from "@/lib/types"

export default function Historial() {
  const { profile } = useAuth()
  const { data: orders, isLoading } = useOrdenes()
  const actualizar = useActualizarEstado()
  const [selected, setSelected] = useState<Order | null>(null)

  const canDecide = profile?.role === "supervisor"

  function onApprove(comments?: string) {
    if (!selected) return
    void actualizar.mutateAsync({
      id: selected.id,
      status: "aprobado",
      opts: {
        supervisorId: profile?.id ?? null,
        supervisorName: profile?.full_name ?? null,
        comments: comments || null,
      },
    })
    setSelected(null)
  }

  function onReject(comments?: string) {
    if (!selected) return
    void actualizar.mutateAsync({
      id: selected.id,
      status: "rechazado",
      opts: {
        supervisorId: profile?.id ?? null,
        supervisorName: profile?.full_name ?? null,
        comments: comments || null,
      },
    })
    setSelected(null)
  }

  function onDeliver() {
    if (!selected) return
    void actualizar.mutateAsync({ id: selected.id, status: "entregado" })
    setSelected(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Almacén"
        title="Historial de pedidos"
        description="Consulta todos los pedidos del almacén y su estado actual."
      />

      <OrderList
        orders={orders}
        loading={isLoading}
        onSelect={setSelected}
        selectedId={selected?.id}
      />

      <OrderDetailDialog
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        order={selected}
        actions={{
          canDecide,
          pending: true,
          busy: actualizar.isPending,
          onApprove,
          onReject,
          ...(profile?.role === "supervisor" || profile?.role === "contratista"
            ? { onDeliver }
            : {}),
        }}
      />
    </div>
  )
}
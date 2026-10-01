"use client"

import { useState } from "react"
import { useOrdenes } from "@/features/pedidos/hooks"
import { useAuth } from "@/providers/AuthProvider"
import { OrderList } from "@/components/shared/orders/OrderList"
import { OrderDetailDialog } from "@/components/shared/orders/OrderDetailDialog"
import { PageHeader } from "@/components/shared/PageHeader"
import { isSupabaseConfigured } from "@/lib/constants"
import type { Order } from "@/lib/types"

export default function MisPedidos() {
  const { profile } = useAuth()
  const { data: orders, isLoading } = useOrdenes()
  const [selected, setSelected] = useState<Order | null>(null)

  const mine = (orders ?? []).filter((o) => {
    if (isSupabaseConfigured()) return o.solicitante_id === profile?.id
    return profile?.full_name ? o.solicitante_name === profile.full_name : false
  })

  return (
    <div>
      <PageHeader
        eyebrow="Solicitante"
        title="Mis pedidos"
        description="Seguimiento de los pedidos que has realizado."
      />

      <OrderList
        orders={mine}
        loading={isLoading}
        onSelect={setSelected}
        selectedId={selected?.id}
      />

      <OrderDetailDialog
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
        order={selected}
      />
    </div>
  )
}
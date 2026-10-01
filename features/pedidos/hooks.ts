"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import toast from "react-hot-toast"
import { repo } from "@/lib/data"
import type { NewOrderInput, Order, OrderStatus } from "@/lib/types"

// ── Productos ─────────────────────────────────────────────

export function useProductos() {
  return useQuery({
    queryKey: ["productos"],
    queryFn: () => repo.getProducts(),
    staleTime: 1000 * 60 * 5,
  })
}

// ── Órdenes ───────────────────────────────────────────────

export function useOrdenes(filter?: {
  status?: OrderStatus
  piso?: string
}) {
  return useQuery({
    queryKey: ["ordenes", filter],
    queryFn: () => repo.listOrders(filter),
    staleTime: 1000 * 20,
  })
}

export function useCrearOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, userId }: { input: NewOrderInput; userId?: string }) =>
      repo.createOrder(input, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["ordenes"] })
      toast.success("Pedido enviado al supervisor")
    },
    onError: (err: Error) => {
      toast.error(`No se pudo enviar: ${err.message}`)
    },
  })
}

export function useActualizarEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      opts,
    }: {
      id: string
      status: OrderStatus
      opts?: {
        supervisorId?: string | null
        supervisorName?: string | null
        comments?: string | null
      }
    }) => repo.setOrderStatus(id, status, opts),
    onSuccess: (order: Order) => {
      void qc.invalidateQueries({ queryKey: ["ordenes"] })
      toast.success(
        order.status === "aprobado"
          ? "Pedido aprobado"
          : order.status === "rechazado"
            ? "Pedido rechazado"
            : "Estado actualizado"
      )
    },
    onError: (err: Error) => {
      toast.error(`No se pudo actualizar: ${err.message}`)
    },
  })
}
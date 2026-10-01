"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { CategoryPill } from "@/components/shared/CategoryPill"
import type { Order } from "@/lib/types"
import { formatDate, initials } from "@/components/shared/orders/OrderCard"

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  actions,
}: {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  actions?: {
    canDecide: boolean
    pending?: boolean
    onApprove: (comments?: string) => void
    onReject: (comments?: string) => void
    onDeliver?: () => void
    busy?: boolean
  }
}) {
  const [comment, setComment] = useState("")

  const items = order?.items ?? []
  const total = items.reduce((a, b) => a + b.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto custom-scrollbar sm:max-w-md max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-[28px] max-sm:rounded-b-none max-sm:p-5 max-sm:pb-6 max-sm:data-open:animate-in max-sm:data-open:fade-in-0 max-sm:data-open:slide-in-from-bottom max-sm:data-closed:animate-out max-sm:data-closed:fade-out-0 max-sm:data-closed:slide-out-to-bottom"
      >
        {order && (
          <>
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border/80 sm:mb-1 sm:hidden" />
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle className="text-lg font-extrabold tracking-tight sm:text-base">
                  Pedido #{order.id.slice(0, 6).toUpperCase()}
                </DialogTitle>
                <StatusBadge status={order.status} />
              </div>
              <DialogDescription className="mt-1 flex items-center gap-3 text-[15px] sm:gap-2 sm:text-sm">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-white sm:size-7 sm:rounded-lg sm:text-[10px]"
                  style={{ backgroundColor: "var(--ani-primary)" }}
                >
                  {initials(order.solicitante_name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-extrabold text-foreground">
                    {order.solicitante_name}
                  </span>
                  <span className="block truncate text-xs font-semibold text-muted-foreground sm:text-[11px]">
                    {order.piso}
                  </span>
                </span>
                <span className="ml-auto shrink-0 text-right text-xs font-semibold text-muted-foreground sm:text-[11px]">
                  Creado
                  <span className="block">{formatDate(order.created_at)}</span>
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2.5 rounded-xl bg-ani-surface-container-low p-3.5 text-[13px] font-semibold text-muted-foreground sm:p-3 sm:text-xs">
              <div className="flex justify-between">
                <span>Líneas</span>
                <span className="font-extrabold text-foreground">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total unidades</span>
                <span className="font-extrabold text-foreground">{total}</span>
              </div>
              {order.supervisor_name && (
                <div className="flex justify-between">
                  <span>Supervisor</span>
                  <span className="font-bold text-foreground">{order.supervisor_name}</span>
                </div>
              )}
              {order.approved_at && (
                <div className="flex justify-between">
                  <span>Aprobado</span>
                  <span className="font-bold text-foreground">
                    {formatDate(order.approved_at)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-border/70 sm:px-3 sm:py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold sm:text-sm">
                      {it.product_name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <CategoryPill category={it.category} />
                      <span className="text-xs font-semibold text-muted-foreground sm:text-[11px]">
                        {it.unit}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xl font-extrabold tabular-nums sm:text-lg">
                    {it.quantity}
                  </span>
                </div>
              ))}
            </div>

            {order.comments && (
              <p className="rounded-xl bg-ani-surface-container-low px-3.5 py-2.5 text-[13px] text-muted-foreground sm:px-3 sm:py-2 sm:text-xs">
                <b>Comentario:</b> {order.comments}
              </p>
            )}

            {actions && actions.canDecide && order.status === "pendiente" && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="block px-0.5 text-xs font-bold text-muted-foreground">
                    Observación (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={220}
                    placeholder="Motivo o detalle para el solicitante…"
                    className="h-20 w-full resize-none rounded-xl border border-input bg-white px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15 sm:h-16 sm:px-3 sm:text-sm"
                  />
                </div>
                <DialogFooter className="-mx-4 -mb-4 max-sm:-mx-5 max-sm:-mb-6 max-sm:flex-row max-sm:items-center">
                  <Button
                    variant="outline"
                    disabled={actions.busy}
                    onClick={() => actions.onReject(comment.trim())}
                    className="h-[3.4rem] flex-1 gap-2 rounded-xl border-destructive/30 text-base font-bold text-destructive hover:bg-destructive/5 sm:h-11 sm:flex-initial sm:rounded-md sm:text-sm"
                  >
                    <span className="material-symbols-outlined text-[22px] sm:text-[18px]">
                      close
                    </span>
                    Rechazar
                  </Button>
                  <Button
                    disabled={actions.busy}
                    onClick={() => actions.onApprove(comment.trim())}
                    className="h-[3.4rem] flex-1 gap-2 rounded-xl bg-ani-primary text-base font-bold text-white hover:opacity-90 sm:h-11 sm:flex-initial sm:rounded-md sm:text-sm"
                  >
                    <span className="material-symbols-outlined text-[22px] sm:text-[18px]">
                      check_circle
                    </span>
                    Aprobar pedido
                  </Button>
                </DialogFooter>
              </div>
            )}

            {actions && actions.pending && order.status !== "pendiente" && (
              <DialogFooter className="-mx-4 -mb-4 max-sm:-mx-5 max-sm:-mb-6 max-sm:flex-row max-sm:items-center">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-[3.4rem] flex-1 rounded-xl text-base font-bold sm:h-11 sm:flex-initial sm:rounded-md sm:text-sm"
                >
                  Cerrar
                </Button>
                {actions.onDeliver && (
                  <Button
                    disabled={actions.busy}
                    onClick={actions.onDeliver}
                    className="h-[3.4rem] flex-1 rounded-xl bg-ani-primary text-base font-bold text-white hover:opacity-90 sm:h-11 sm:flex-initial sm:rounded-md sm:text-sm"
                  >
                    Marcar entregado
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
import { STATUS_META } from "@/lib/constants"
import type { OrderStatus } from "@/lib/types"

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
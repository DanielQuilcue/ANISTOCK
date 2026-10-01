import type { ReactNode } from "react"
import { Inbox } from "lucide-react"

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-border/70">
      <span className="grid size-12 place-items-center rounded-2xl bg-ani-surface-container-low text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <p className="text-sm font-bold">{title}</p>
      {description && (
        <p className="max-w-xs text-[13px] text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  )
}
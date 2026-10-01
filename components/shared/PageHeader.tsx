import type { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-extrabold tracking-[0.18em] text-ani-secondary uppercase sm:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
import { CATEGORY_META } from "@/lib/constants"
import type { Category } from "@/lib/types"
import { Coffee, Droplets } from "lucide-react"

export function CategoryPill({ category }: { category: Category }) {
  const meta = CATEGORY_META[category]
  const Icon = category === "cafeteria" ? Coffee : Droplets
  return (
    <span
      className="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold"
      style={{ backgroundColor: meta.soft, color: meta.color }}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  )
}
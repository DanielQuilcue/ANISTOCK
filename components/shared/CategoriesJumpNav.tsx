"use client"

export interface JumpItem {
  id: string
  label: string
  color: string
  count?: number
}

export function CategoriesJumpNav({ items }: { items: JumpItem[] }) {
  function go(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div
      className="sticky top-14 z-30 -mx-4 mb-4 px-4 py-2 sm:hidden"
      style={{
        backgroundColor: "color-mix(in srgb, var(--ani-background) 88%, transparent)",
      }}
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => go(it.id)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold active:scale-95"
            style={{
              color: it.color,
              backgroundColor: "var(--ani-surface-container-low)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, currentColor 25%, transparent)",
            }}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            {it.label}
            {typeof it.count === "number" && it.count > 0 && (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: it.color }}
              >
                {it.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
"use client"

import { useMemo, useState } from "react"
import { useProductos, useCrearOrden } from "@/features/pedidos/hooks"
import { useAuth } from "@/providers/AuthProvider"
import { Stepper } from "@/components/shared/Stepper"
import { PageHeader } from "@/components/shared/PageHeader"
import { CategoriesJumpNav } from "@/components/shared/CategoriesJumpNav"
import { CategoryPill } from "@/components/shared/CategoryPill"
import { FLOORS, CATEGORY_META } from "@/lib/constants"
import type { Category, Product } from "@/lib/types"
import { Coffee, Droplets, Search } from "lucide-react"

export default function PedidoForm() {
  const { profile } = useAuth()
  const { data: products, isLoading } = useProductos()
  const crear = useCrearOrden()

  const [name, setName] = useState(profile?.full_name ?? "")
  const [piso, setPiso] = useState(profile?.piso ?? "")
  const [qty, setQty] = useState<Record<string, number>>({})
  const [search, setSearch] = useState("")
  const [sent, setSent] = useState(false)

  const byCategory = useMemo(() => {
    const filter = search.trim().toLowerCase()
    const list =
      products?.filter(
        (p) => !filter || p.name.toLowerCase().includes(filter)
      ) ?? []
    return {
      cafeteria: list.filter((p) => p.category === "cafeteria"),
      aseo: list.filter((p) => p.category === "aseo"),
    }
  }, [products, search])

  const selectedCount = Object.values(qty).reduce((a, b) => a + (b ?? 0), 0)
  const selectedItems = (products ?? []).filter((p) => (qty[p.id] ?? 0) > 0)
  const selectedIn = (category: Category) =>
    selectedItems.filter((p) => p.category === category)

  function update(p: Product, v: number) {
    setQty((prev) => ({ ...prev, [p.id]: v }))
  }

  async function handleSubmit() {
    if (!name.trim() || !piso) return
    const items = selectedItems.map((p) => ({ product_id: p.id, quantity: qty[p.id]! }))
    if (items.length === 0) return
    await crear.mutateAsync({
      input: { solicitante_name: name.trim(), piso, items },
      userId: profile?.id,
    })
    setQty({})
    setSent(true)
    window.setTimeout(() => setSent(false), 4000)
  }

  const categorySections: { id: string; category: Category; icon: React.ReactNode }[] = [
    { id: "cat-cafeteria", category: "cafeteria", icon: <Coffee className="size-4" /> },
    { id: "cat-aseo", category: "aseo", icon: <Droplets className="size-4" /> },
  ]

  const ready = selectedCount > 0 && name.trim() && Boolean(piso)

  return (
    <div>
      <PageHeader
        eyebrow="Solicitante"
        title="Nuevo pedido de suministros"
        description="Pide cafetería y aseo para tu piso. El pedido queda pendiente hasta que el supervisor apruebe la entrega física."
      />

      {/* Salto rápido entre categorías (móvil) */}
      <CategoriesJumpNav
        items={categorySections.map(({ id, category }) => ({
          id,
          label: CATEGORY_META[category].label,
          color: CATEGORY_META[category].color,
          count: selectedIn(category).length,
        }))}
      />

      {/* Quién solicita */}
      <section className="rounded-2xl bg-white p-4 ring-1 ring-border/70 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              className="h-12 w-full rounded-xl border border-input bg-white px-3.5 text-[15px] outline-none focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15 sm:h-11 sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">Piso</label>
            <select
              value={piso}
              onChange={(e) => setPiso(e.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-white px-3 text-[15px] outline-none focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15 sm:h-11 sm:text-sm"
            >
              <option value="">Selecciona tu piso…</option>
              {FLOORS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="h-11 w-full rounded-xl border border-input bg-ani-surface-container-low pr-3.5 pl-10 text-[15px] outline-none focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15 sm:h-10 sm:text-sm"
          />
        </div>
      </section>

      {/* Categorías */}
      <div className="mt-5 space-y-5">
        {categorySections.map(({ id, category, icon }) => {
          const list = byCategory[category]
          const meta = CATEGORY_META[category]
          const selected = selectedIn(category).length
          return (
            <section
              key={category}
              id={id}
              className="scroll-mt-[8.5rem] overflow-hidden rounded-2xl bg-white ring-1 ring-border/70"
            >
              <div
                className="flex items-center gap-2 px-4 py-3.5 sm:px-5"
                style={{ backgroundColor: meta.soft }}
              >
                <span style={{ color: meta.color }}>{icon}</span>
                <h2 className="text-sm font-extrabold" style={{ color: meta.color }}>
                  {meta.label}
                </h2>
                {selected > 0 && (
                  <span
                    className="inline-flex h-5 items-center rounded-full px-2 text-[11px] font-bold"
                    style={{ backgroundColor: meta.color, color: "#fff" }}
                  >
                    {selected} sel.
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-xl bg-ani-surface-container-low" />
                  ))}
                </div>
              ) : list.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No se encontraron productos.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {list.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-4 py-4 active:bg-ani-surface-container-low sm:px-5 sm:py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold sm:text-sm">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                          por {p.unit}
                        </p>
                      </div>
                      <Stepper
                        value={qty[p.id] ?? 0}
                        onChange={(v) => update(p, v)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {/* Resumen */}
      {selectedItems.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-border/70 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-extrabold">Resumen</h3>
            <button
              onClick={() => setQty({})}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Vaciar
            </button>
          </div>
          <div className="space-y-2">
            {selectedItems.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <CategoryPill category={p.category} />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                <span className="font-extrabold tabular-nums">
                  {qty[p.id]} × {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de envío */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mt-6 md:static md:bottom-0">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-2xl ring-1 ring-border/70 backdrop-blur sm:p-4 md:shadow-xl">
          <div className="shrink-0 pl-1">
            <p className="text-[11px] font-semibold text-muted-foreground sm:text-xs">
              {selectedItems.length} producto{selectedItems.length !== 1 && "s"}
            </p>
            <p className="text-xl font-extrabold tabular-nums sm:text-2xl">
              {selectedCount}{" "}
              <span className="text-xs font-semibold text-muted-foreground">
                unidades
              </span>
            </p>
          </div>
          <button
            onClick={() => void handleSubmit()}
            disabled={crear.isPending || !ready}
            className="flex h-14 flex-1 max-w-xs items-center justify-center gap-2 rounded-xl bg-ani-primary px-5 text-[15px] font-bold text-white shadow-lg shadow-ani-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-12 sm:max-w-none sm:flex-initial sm:px-6 sm:text-sm"
          >
            {crear.isPending ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <span className="material-symbols-outlined text-[22px] sm:text-[20px]">send</span>
            )}
            {crear.isPending ? "Enviando…" : "Enviar pedido"}
          </button>
        </div>
      </div>

      {sent && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-ani-primary-container/15 px-4 py-3 text-[13px] font-semibold text-ani-primary">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Pedido enviado. El supervisor debe aprobar la entrega.
        </p>
      )}
    </div>
  )
}
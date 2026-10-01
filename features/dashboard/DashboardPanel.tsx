"use client"

import { useState } from "react"
import { useMetricas } from "@/features/dashboard/hooks"
import { useOrdenes } from "@/features/pedidos/hooks"
import { MetricCard } from "@/components/shared/MetricCard"
import { BarChart } from "@/components/shared/BarChart"
import { Segmented } from "@/components/shared/Segmented"
import { PageHeader } from "@/components/shared/PageHeader"
import { CATEGORY_META } from "@/lib/constants"
import type { Category, Granularity } from "@/lib/types"
import { Coffee, Droplets, PackageCheck, ReceiptText, CalendarDays, CalendarRange } from "lucide-react"

export default function DashboardPanel() {
  const [granularity, setGranularity] = useState<Granularity>("semana")
  const { summary, series, fromISO } = useMetricas(granularity)
  const { data: allOrders } = useOrdenes()

  const cats = summary.data ?? []
  const units = cats.reduce((a, c) => a + c.total, 0)
  const inWindow =
    allOrders?.filter((o) => {
      if (o.created_at < fromISO) return false
      return o.status === "aprobado" || o.status === "entregado"
    }) ?? []
  const caf = cats.find((c) => c.category === "cafeteria")
  const ase = cats.find((c) => c.category === "aseo")
  const topProducts = topItems(allOrders, fromISO, 5)

  return (
    <div>
      <PageHeader
        eyebrow="Contratista"
        title="Panel de consumo"
        description="Unidades solicitadas y aprobadas por categoría. Los pedidos deben existir físicamente para aprobarse."
      />

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<PackageCheck className="size-5" />}
          label="Unidades aprobadas"
          value={String(units)}
          sub={granularity === "semana" ? "últimas 12 semanas" : "últimos 6 meses"}
          accent="var(--ani-primary)"
        />
        <MetricCard
          icon={<ReceiptText className="size-5" />}
          label="Pedidos confirmados"
          value={String(inWindow.length)}
          sub={granularity === "semana" ? "aprobados + entregados" : "en el período"}
          accent="#0284c7"
        />
        <MetricCard
          icon={<Coffee className="size-5" />}
          label="Cafetería"
          value={String(caf?.total ?? 0)}
          sub={caf ? `${Math.round(caf.share * 100)}% del consumo` : "sin datos"}
          accent={CATEGORY_META.cafeteria.color}
        />
        <MetricCard
          icon={<Droplets className="size-5" />}
          label="Aseo"
          value={String(ase?.total ?? 0)}
          sub={ase ? `${Math.round(ase.share * 100)}% del consumo` : "sin datos"}
          accent={CATEGORY_META.aseo.color}
        />
      </div>

      {/* Gráfico */}
      <section className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-border/70">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold">Consumo de unidades</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              {granularity === "semana" ? "Por semana" : "Por mes"} · solo
              pedidos aprobados o entregados
            </p>
          </div>
          <Segmented
            options={[
              { value: "semana", label: "Semana", icon: <CalendarDays className="size-3.5" /> },
              { value: "mes", label: "Mes", icon: <CalendarRange className="size-3.5" /> },
            ]}
            value={granularity}
            onChange={setGranularity}
          />
        </div>
        {series.isLoading ? (
          <div className="h-52 animate-pulse rounded-2xl bg-ani-surface-container-low" />
        ) : (
          <BarChart data={series.data ?? []} granularity={granularity} />
        )}
      </section>

      {/* Distribución + top productos */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/70">
          <h2 className="text-base font-extrabold">Distribución por categoría</h2>
          <p className="text-xs font-semibold text-muted-foreground">
            Cuota de unidades en el período
          </p>
          <div className="mt-4 space-y-4">
            {cats.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos en el período.</p>
            )}
            {cats.map((c) => {
              const meta = CATEGORY_META[c.category]
              return (
                <div key={c.category}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-bold">{meta.label}</span>
                    <span className="font-extrabold tabular-nums">
                      {c.total}
                      <span className="ml-1 text-xs font-semibold text-muted-foreground">
                        {Math.round(c.share * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-ani-surface-container-low">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, c.share * 100)}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-border/70">
          <h2 className="text-base font-extrabold">Productos más pedidos</h2>
          <p className="text-xs font-semibold text-muted-foreground">
            Por unidades aprobadas en el período
          </p>
          <div className="mt-3 divide-y divide-border/60">
            {topProducts.length === 0 && (
              <p className="py-3 text-sm text-muted-foreground">Sin datos en el período.</p>
            )}
            {topProducts.map((row, i) => {
              const meta = CATEGORY_META[row.category]
              return (
                <div key={row.name} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold"
                    style={{ backgroundColor: meta.soft, color: meta.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {row.name}
                  </span>
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-extrabold tabular-nums">{row.units}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function topItems(
  orders: { status: string; created_at: string; items?: { product_name: string; category: string; quantity: number }[] }[] | undefined,
  fromISO: string,
  limit: number
) {
  const counts = new Map<string, { name: string; category: Category; units: number }>()
  for (const o of orders ?? []) {
    if (o.created_at < fromISO) continue
    if (o.status !== "aprobado" && o.status !== "entregado") continue
    for (const it of o.items ?? []) {
      const cur = counts.get(it.product_name) ?? {
        name: it.product_name,
        category: (it.category === "aseo" ? "aseo" : "cafeteria") as Category,
        units: 0,
      }
      cur.units += it.quantity
      counts.set(it.product_name, cur)
    }
  }
  return [...counts.values()].sort((a, b) => b.units - a.units).slice(0, limit)
}
"use client"

import { useMemo, useState } from "react"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"
import { useOrdenes } from "@/features/pedidos/hooks"
import { PageHeader } from "@/components/shared/PageHeader"
import { Segmented } from "@/components/shared/Segmented"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CATEGORY_META, STATUS_META } from "@/lib/constants"
import type { Category, Order, OrderStatus } from "@/lib/types"

type Range = "7" | "30" | "90" | "todo"

const RANGES: { value: Range; label: string }[] = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "todo", label: "Todo" },
]

interface Row {
  fecha: string
  piso: string
  solicitante: string
  categoria: string
  producto: string
  unidad: string
  cantidad: number
  estado: string
  supervisor: string
  comentario: string
}

export default function ReportesPanel() {
  const { data: orders, isLoading } = useOrdenes()
  const [range, setRange] = useState<Range>("30")
  const [status, setStatus] = useState<OrderStatus | "todos">("todos")
  const [category, setCategory] = useState<Category | "todas">("todas")
  const [exporting, setExporting] = useState(false)

  const rows = useMemo(() => buildRows(orders ?? [], range, status, category), [orders, range, status, category])

  async function exportFile(kind: "xlsx" | "csv") {
    try {
      setExporting(true)
      const ws = XLSX.utils.json_to_sheet(rows)
      // Ancho aproximado de columnas para el informe
      ws["!cols"] = [
        { wch: 18 }, { wch: 9 }, { wch: 18 }, { wch: 10 },
        { wch: 26 }, { wch: 10 }, { wch: 9 }, { wch: 12 },
        { wch: 18 }, { wch: 26 },
      ]
      if (kind === "xlsx") {
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Pedidos")
        XLSX.writeFile(wb, `anistock-reporte-${range}d.xlsx`)
      } else {
        const csv = XLSX.utils.sheet_to_csv(ws)
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `anistock-reporte-${range}d.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Reporte exportado (${rows.length} filas)`)
    } catch (err) {
      toast.error(`No se pudo exportar: ${err instanceof Error ? err.message : ""}`)
    } finally {
      setExporting(false)
    }
  }

  const statusOptions: { value: OrderStatus | "todos"; label: string }[] = [
    { value: "todos", label: "Todos" },
    ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k as OrderStatus, label: v.label })),
  ]
  const categoryOptions: { value: Category | "todas"; label: string }[] = [
    { value: "todas", label: "Todas" },
    ...Object.entries(CATEGORY_META).map(([k, v]) => ({ value: k as Category, label: v.label })),
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Reportes"
        title="Exportación de datos"
        description="Descarga el detalle de pedidos en Excel o CSV para tu gestión de inventario y compras."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void exportFile("csv")}
              disabled={rows.length === 0 || exporting}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-ani-surface-container-low disabled:pointer-events-none disabled:opacity-40"
            >
              CSV
            </button>
            <button
              onClick={() => void exportFile("xlsx")}
              disabled={rows.length === 0 || exporting}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-ani-primary px-4 text-[13px] font-bold text-white shadow-md shadow-ani-primary/20 transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              {exporting ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">download</span>
              )}
              Excel (.xlsx)
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-border/70">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground">Período</label>
          <Segmented options={RANGES} value={range} onChange={setRange} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "todos")}
            className="h-8 rounded-full border border-border bg-ani-surface-container-low px-3 text-[13px] font-semibold outline-none focus:border-ani-primary"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-muted-foreground">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "todas")}
            className="h-8 rounded-full border border-border bg-ani-surface-container-low px-3 text-[13px] font-semibold outline-none focus:border-ani-primary"
          >
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto rounded-full bg-ani-surface-container-high px-3 py-1 text-xs font-extrabold tabular-nums">
          {rows.length} fila{rows.length !== 1 && "s"}
        </span>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl bg-white ring-1 ring-border/70">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-ani-surface-container-low" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No hay pedidos que coincidan con los filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Comentario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{r.fecha}</TableCell>
                  <TableCell className="font-semibold">{r.piso}</TableCell>
                  <TableCell>{r.solicitante}</TableCell>
                  <TableCell>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: CATEGORY_META[r.categoria as Category]?.soft,
                        color: CATEGORY_META[r.categoria as Category]?.color,
                      }}
                    >
                      {r.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{r.producto}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unidad}</TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums">
                    {r.cantidad}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.estado.toLowerCase() as OrderStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.supervisor || "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {r.comentario || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function buildRows(
  orders: Order[],
  range: Range,
  status: OrderStatus | "todos",
  category: Category | "todas"
): Row[] {
  const cutoff =
    range === "todo" ? null : Date.now() - Number(range) * 86400000
  const rows: Row[] = []
  for (const o of orders) {
    if (status !== "todos" && o.status !== status) continue
    const created = new Date(o.created_at).getTime()
    if (cutoff !== null && created < cutoff) continue
    for (const it of o.items ?? []) {
      if (category !== "todas" && it.category !== category) continue
      rows.push({
        fecha: new Date(o.created_at).toLocaleDateString("es-CO"),
        piso: o.piso,
        solicitante: o.solicitante_name,
        categoria: CATEGORY_META[it.category].label,
        producto: it.product_name,
        unidad: it.unit,
        cantidad: it.quantity,
        estado: STATUS_META[o.status].label,
        supervisor: o.supervisor_name ?? "",
        comentario: o.comments ?? "",
      })
    }
  }
  return rows
}
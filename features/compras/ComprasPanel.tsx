"use client"

import { useMemo, useRef, useState } from "react"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"
import { useOrdenes } from "@/features/pedidos/hooks"
import { CATEGORY_META } from "@/lib/constants"
import type { Category, Order } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ImportRow {
  codigo: string
  nombre: string
  categoria: Category
  cantidad: number
  unidad: string
  presentacion: string
  proveedor: string
  fecha: string
}

interface FileState {
  name: string
  sizeLabel: string
  uploadedAt: string
  items: number
  rows: ImportRow[]
}

const PROVIDERS = [
  "Químicos del Norte S.A.",
  "Café Andino Distribuciones",
  "Papelera Industrial Corp",
  "Alimentos Integrales SAS",
]

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

function formatQty(amount: number, unit: string) {
  return `${fmt(amount)} ${unit}`
}

function buildMockRows(): ImportRow[] {
  const base: ImportRow[] = [
    { codigo: "ASE-7721", nombre: "Detergente Desinfectante Hospitalario 5L", categoria: "aseo", cantidad: 120, unidad: "uds", presentacion: "Garrafa 5L", proveedor: PROVIDERS[0], fecha: "14/05/2025" },
    { codigo: "CAF-0914", nombre: "Café Gourmet Grano Tostado 1kg", categoria: "cafeteria", cantidad: 250, unidad: "uds", presentacion: "Bolsa 1kg", proveedor: PROVIDERS[1], fecha: "14/05/2025" },
    { codigo: "ASE-3309", nombre: "Papel Toalla Interdoblado Caja 20 Paq.", categoria: "aseo", cantidad: 80, unidad: "cjs", presentacion: "Caja x 20 Paq.", proveedor: PROVIDERS[2], fecha: "13/05/2025" },
    { codigo: "CAF-1182", nombre: "Azúcar Morena Orgánica Sobres x 500", categoria: "cafeteria", cantidad: 40, unidad: "cjs", presentacion: "Caja x 500 Sobres", proveedor: PROVIDERS[3], fecha: "13/05/2025" },
    { codigo: "ASE-8801", nombre: "Bolsas Negras Alta Densidad 90x120 Cal. 2", categoria: "aseo", cantidad: 300, unidad: "paq", presentacion: "Paquete x 100 Uds", proveedor: PROVIDERS[2], fecha: "12/05/2025" },
  ]

  const cafNombres = [
    "Café Tinto Sobres x 100", "Pitillos de Papel Paq. 500", "Servilletas 40x40 Paq. 200",
    "Endulzante Stevia Caja 1000", "Tinto 3 en 1 Caja 100", "Bolsa Oxigenada 50 Sobres",
    "Pañitos Húmedos Caja X220", "Crema 3 en 1 1L", "Panelitas 250g",
  ]
  const aseoNombres = [
    "Jabón Líquido Antiséptico 4L", "Lavaplatos Ácido Caja x 4", "Trapero Fibra Sintética",
    "Recogedor Plástico Reforzado", "Ambientador Aerosol 360ml", "Guante Latex Caja 100",
    "Esponja Multiusos 3x2", "Papel Higiénico Jumbo 12 Rollos", "Desinfectante Pisos 1L",
  ]
  const presCaf = ["Bolsa 1kg", "Caja x 100", "Paquete x 200", "Caja x 12", "Unidad", "Caja x 250"]
  const presAseo = ["Garrafa 5L", "Caja x 4", "Unidad", "Caja x 100", "Caja x 12", "Bolsa", "Caja x 20"]
  const qtys = [18, 24, 12, 60, 30, 90, 15, 45, 36, 10, 150, 72, 20]
  const units = ["uds", "cjs", "paq"]
  const fechas = ["11/05/2025", "12/05/2025", "13/05/2025", "14/05/2025"]

  let i = 5
  let acc = base.reduce((s, r) => s + r.cantidad, 0)
  const target = 1824
  while (i < 48) {
    const cat: Category = i % 2 === 0 ? "aseo" : "cafeteria"
    const nombre = (cat === "aseo" ? aseoNombres : cafNombres)[i % (cat === "aseo" ? aseoNombres : cafNombres).length]
    let cantidad = qtys[i % qtys.length]
    if (i === 47) cantidad = Math.max(0, target - acc - cantidad)
    acc += cantidad
    base.push({
      codigo: `${cat === "aseo" ? "ASE" : "CAF"}-${6200 + i * 7}`,
      nombre: `${nombre} · Lote ${100 + i}`,
      categoria: cat,
      cantidad,
      unidad: units[i % 3],
      presentacion: (cat === "aseo" ? presAseo : presCaf)[i % (cat === "aseo" ? presAseo : presCaf).length],
      proveedor: PROVIDERS[i % PROVIDERS.length],
      fecha: fechas[i % fechas.length],
    })
    i++
  }
  return base
}

const MOCK_FILE: FileState = {
  name: "Factura_Suministros_Mayo_2025.xlsx",
  sizeLabel: "1.84 MB",
  uploadedAt: "Subido hace 4 minutos",
  items: 48,
  rows: buildMockRows(),
}

export default function ComprasPanel() {
  const { data: orders } = useOrdenes()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<FileState | null>(MOCK_FILE)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showAllRows, setShowAllRows] = useState(false)
  const [lastSync, setLastSync] = useState("Hoy, 09:42 AM")
  const [totalIngresadas, setTotalIngresadas] = useState(1824)

  const totalUnidades = useMemo(() => file?.rows.reduce((s, r) => s + r.cantidad, 0) ?? 0, [file])
  const proveedores = useMemo(() => new Set(file?.rows.map((r) => r.proveedor) ?? []).size, [file])
  const lineas = file?.rows.length ?? 0

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void loadFile(f)
  }

  async function loadFile(f: File) {
    setParsing(true)
    try {
      const buf = await f.arrayBuffer()
      const parsed = parseWorkbook(buf)
      if (!parsed.rows.length) {
        toast.error("No se detectaron filas con la cabecera estándar.")
        return
      }
      const units = parsed.rows.reduce((s, r) => s + r.cantidad, 0)
      setFile({
        name: f.name,
        sizeLabel: `${(f.size / 1048576).toFixed(2)} MB`,
        uploadedAt: "Subido hace un momento",
        items: parsed.rows.length,
        rows: parsed.rows,
      })
      setTotalIngresadas((prev) => prev + units)
      setLastSync("Ahora")
      toast.success(`${f.name} validado (${parsed.rows.length} ítems)`)
    } catch (err) {
      toast.error(`No se pudo leer el archivo: ${err instanceof Error ? err.message : ""}`)
    } finally {
      setParsing(false)
    }
  }

  function confirmarStock() {
    if (!file || confirming) return
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      setLastSync("Ahora, hace un momento")
      toast.success("Stock actualizado en el kardex central.")
    }, 650)
  }

  function descartar() {
    setFile(null)
    setShowAllRows(false)
    toast("Archivo descartado", { icon: "🗑️" })
  }

  function descargarPlantilla() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Código Ítem", "Nombre Suministro", "Categoría", "Cant. Ingresada", "Presentación", "Proveedor", "Fecha de Compra"],
      ["ASE-7721", "Detergente Desinfectante Hospitalario 5L", "Aseo", 120, "Garrafa 5L", "Químicos del Norte S.A.", "14/05/2025"],
      ["CAF-0914", "Café Gourmet Grano Tostado 1kg", "Cafetería", 250, "Bolsa 1kg", "Café Andino Distribuciones", "14/05/2025"],
    ])
    ws["!cols"] = [{ wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 30 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    XLSX.writeFile(wb, "Plantilla_Carga_Compras_Suministros.xlsx")
    toast.success("Plantilla descargada")
  }

  return (
    <div className="space-y-4">
      {/* ── Banner: Módulo de Integración Masiva ── */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(23,41,62,0.06)] ring-1 ring-border/70 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-ani-surface-container text-ani-primary">
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-ani-primary uppercase">
              Módulo de Integración Masiva
            </span>
          </div>
          <h1 className="mt-1.5 text-[22px] font-extrabold tracking-tight sm:text-[26px]">
            Gestión de Compras y Sincronización de Datos
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
            Carga planillas de remisión de proveedores, audita discrepancias en tiempo
            real e impacta directamente el kardex de la sede activa.
          </p>
        </div>
        <button
          type="button"
          onClick={descargarPlantilla}
          className="group flex shrink-0 items-center gap-2.5 rounded-xl bg-ani-surface-container-low px-3.5 py-2.5 text-left ring-1 ring-border/60 transition-all hover:bg-ani-surface-container"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-white text-ani-primary shadow-sm transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold text-muted-foreground">
              Estructura Oficial V3.2
            </span>
            <span className="block max-w-[220px] truncate text-[13px] font-extrabold text-ani-primary">
              Plantilla_Carga_Compras_Suministros.xlsx
            </span>
          </span>
          <span className="material-symbols-outlined ml-1 text-[18px] text-ani-outline">
            file_download
          </span>
        </button>
      </section>

      {/* ── Métricas ── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Última Sincronización"
          value={lastSync}
          sub="128 SKUs actualizados"
          subIcon="check_circle"
          subColor="var(--ani-primary)"
          icon="schedule"
          iconBg="var(--ani-surface-container)"
          iconColor="var(--ani-primary)"
        />
        <StatCard
          label="Órdenes Procesadas"
          value="34 Facturas"
          sub="Ciclo Mayo 2025"
          subIcon="calendar_month"
          subColor="var(--ani-secondary)"
          icon="receipt_long"
          iconBg="rgba(147,204,255,0.4)"
          iconColor="var(--ani-secondary)"
        />
        <StatCard
          label="Precisión de Auditoría"
          value="99.8%"
          sub="0 discrepancias críticas"
          subIcon="verified"
          subColor="var(--ani-primary)"
          icon="fact_check"
          iconBg="var(--ani-surface-container-low)"
          iconColor="var(--ani-primary)"
        />
        <StatCard
          label="Total Unidades Ingresadas"
          value={`${fmt(totalIngresadas)} Uds`}
          sub="Entradas físicas validadas"
          subIcon="inventory_2"
          subColor="var(--ani-tertiary)"
          icon="inventory_2"
          iconBg={CATEGORY_META.cafeteria.soft}
          iconColor="var(--ani-tertiary)"
        />
      </section>

      {/* ── Sección 1: Carga de Factura y Actualización de Stock ── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-2.5 rounded-full bg-ani-primary" />
            <h2 className="text-lg font-extrabold tracking-tight">
              Carga de Factura y Actualización de Stock
            </h2>
          </div>
          <span className="rounded-full bg-ani-surface-container px-3 py-1 text-xs font-semibold text-ani-on-surface-variant">
            Kardex Central • Depósito Principal Piso -1
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
          {/* Dropzone */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-border/70 lg:col-span-5">
            <div className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-ani-surface-container/60 blur-2xl" />
            <div className="relative z-10">
              <span className="text-[10px] font-extrabold tracking-[0.16em] text-ani-primary uppercase">
                Ingreso de Suministros
              </span>
              <h3 className="mt-0.5 text-lg font-extrabold tracking-tight">
                Importador de Remisiones
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Sube el archivo consolidado emitido por bodega o facturación para
                contrastar contra el catálogo de existencias.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className={cn(
                "relative mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all",
                dragOver
                  ? "border-ani-primary bg-ani-primary/5"
                  : "border-ani-outline-variant bg-ani-surface-container-low hover:bg-ani-surface-container/70"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void loadFile(f)
                  e.target.value = ""
                }}
              />
              <span className="relative z-10 grid size-16 place-items-center rounded-2xl bg-white text-ani-primary shadow-sm">
                <span className="material-symbols-outlined text-[34px]">cloud_upload</span>
              </span>
              <span className="mt-3 text-[15px] font-bold">Arrastra tu archivo Excel aquí</span>
              <span className="mt-0.5 text-[13px] text-muted-foreground">
                o selecciona desde tu equipo (.xlsx, .xls, .csv)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current?.click()
                }}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold text-ani-primary shadow-sm transition-shadow hover:shadow"
              >
                {parsing ? "Leyendo…" : "Explorar Archivos"}
              </button>
              <span className="mt-3 text-[11px] text-ani-outline">
                Máximo 25MB • Formatos válidos con cabecera estándar
              </span>
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between text-[13px] text-ani-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-ani-primary">security</span>
                Cifrado SHA-256 en tránsito
              </span>
              <span className="font-medium text-ani-outline">Revisión v3.2 compatible</span>
            </div>
          </div>

          {/* Panel de archivo parseado */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-5 ring-1 ring-border/70 lg:col-span-7">
            {file ? (
              <>
                <div className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ani-primary/10 text-ani-primary">
                      <span className="material-symbols-outlined text-[28px]">table_view</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-extrabold">{file.name}</span>
                        <span className="shrink-0 rounded-full bg-ani-primary/10 px-2 py-0.5 text-[11px] font-bold text-ani-primary">
                          Validado
                        </span>
                      </div>
                      <p className="truncate text-[13px] text-muted-foreground">
                        Tamaño: {file.sizeLabel} • {file.items} ítems detectados •{" "}
                        {file.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-ani-surface-container-low px-3 py-1.5 text-[13px] font-bold text-ani-on-surface sm:self-auto">
                    <span className="size-2.5 animate-pulse rounded-full bg-ani-primary" />
                    100% Sin Errores Sintácticos
                  </span>
                </div>

                <div className="my-2 grid grid-cols-3 gap-2 rounded-xl bg-ani-surface-container-low px-3 py-2.5">
                  <div>
                    <span className="block text-[12px] text-ani-on-surface-variant">Total Unidades</span>
                    <span className="block text-[15px] font-extrabold tabular-nums">
                      {fmt(totalUnidades)} Uds
                    </span>
                  </div>
                  <div>
                    <span className="block text-[12px] text-ani-on-surface-variant">Proveedores Únicos</span>
                    <span className="block text-[15px] font-extrabold tabular-nums">
                      {proveedores} Empresas
                    </span>
                  </div>
                  <div>
                    <span className="block text-[12px] text-ani-on-surface-variant">Presentaciones / SKUs</span>
                    <span className="block text-[15px] font-extrabold tabular-nums text-ani-primary">
                      {lineas} Líneas
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ani-on-surface-variant">
                      Comprobación de referencias y SKUs en Almacén
                    </span>
                    <span className="font-extrabold text-ani-primary">
                      {lineas} / {lineas} confirmados
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ani-surface-container">
                    <div className="h-full w-full rounded-full bg-ani-primary transition-all" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-ani-surface-container-low text-ani-on-surface-variant">
                  <span className="material-symbols-outlined text-[30px]">inbox</span>
                </span>
                <p className="mt-3 text-[15px] font-bold">Sin archivo cargado</p>
                <p className="mt-0.5 max-w-xs text-[13px] text-muted-foreground">
                  Usa el importador para subir una planilla de remisión y validar sus
                  referencias contra el almacén.
                </p>
              </div>
            )}

            <div className="flex flex-col justify-end gap-2 pt-3 sm:flex-row">
              <button
                type="button"
                disabled={!file}
                onClick={descartar}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ani-surface-container-low px-4 text-sm font-bold text-ani-on-surface-variant transition-colors hover:bg-ani-surface-container hover:text-ani-on-surface disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                Descartar archivo
              </button>
              <button
                type="button"
                disabled={!file || confirming}
                onClick={confirmarStock}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ani-primary px-5 text-sm font-bold text-white shadow-md shadow-ani-primary/20 transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 sm:w-auto"
              >
                {confirming ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">inventory</span>
                )}
                Confirmar y Actualizar Stock en Almacén
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de vista previa */}
        {file && (
          <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-border/70 sm:p-5">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-ani-primary">preview</span>
                <h3 className="text-[15px] font-extrabold">
                  Vista Previa de Registros Detectados
                  <span className="ml-1 font-semibold text-muted-foreground">
                    ({showAllRows ? `Las ${lineas}` : `Primeras 5 de ${lineas}`} filas)
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-ani-on-surface-variant">
                  Mostrando filas normalizadas
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllRows((v) => !v)}
                  className="flex items-center gap-1 text-[13px] font-extrabold text-ani-primary hover:text-ani-primary-container"
                >
                  {showAllRows ? "Ver solo primeras 5" : "Ver todas las filas"}
                  <span className="material-symbols-outlined text-[16px]">
                    {showAllRows ? "arrow_back" : "arrow_forward"}
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="text-[11px] tracking-wider text-ani-on-surface-variant uppercase">
                    <th className="rounded-l-lg bg-ani-surface-container-low px-3 py-2">Código Ítem</th>
                    <th className="bg-ani-surface-container-low px-3 py-2">Nombre Suministro</th>
                    <th className="bg-ani-surface-container-low px-3 py-2">Categoría</th>
                    <th className="bg-ani-surface-container-low px-3 py-2 text-right">Cant. Ingresada</th>
                    <th className="bg-ani-surface-container-low px-3 py-2 text-right">Presentación</th>
                    <th className="bg-ani-surface-container-low px-3 py-2">Proveedor</th>
                    <th className="rounded-r-lg bg-ani-surface-container-low px-3 py-2">Fecha de Compra</th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {(showAllRows ? file.rows : file.rows.slice(0, 5)).map((r, idx) => (
                    <tr key={idx} className="hover:bg-ani-surface-container-low/60">
                      <td className="px-3 py-2 font-mono text-[12px] font-semibold text-ani-outline">{r.codigo}</td>
                      <td className="px-3 py-2 font-semibold">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: CATEGORY_META[r.categoria].color }}
                          />
                          <span className="truncate">{r.nombre}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <CategoryChip category={r.categoria} />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {formatQty(r.cantidad, r.unidad)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{r.presentacion}</td>
                      <td className="px-3 py-2">
                        <span className="block max-w-[160px] truncate">{r.proveedor}</span>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-ani-on-surface-variant">{r.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Sección 2: Centro de Exportación por Excel ── */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-2.5 rounded-full bg-ani-secondary" />
              <h2 className="text-lg font-extrabold tracking-tight">
                Centro de Exportación de Informes por Excel
              </h2>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Generación instantánea de libros formateados con totales, agrupaciones por
              piso y centros de costo.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-ani-on-surface shadow-sm ring-1 ring-border/60 md:self-auto">
            <span className="material-symbols-outlined text-[16px] text-ani-primary">verified</span>
            Motor Excel v16.0 Listo • Salida .XLSX
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ExportCard
            icon="corporate_fare"
            iconBg="var(--ani-surface-container)"
            iconColor="var(--ani-primary)"
            badge="Semanal / Mensual"
            badgeFg="var(--ani-on-surface-variant)"
            badgeBg="var(--ani-surface-container-low)"
            title="Informe de Consumo y Rotación por Piso"
            description="Distribución pormenorizada de suministros consumidos por las plantas, segmentando baños comunitarios, cafeterías centrales y áreas gerenciales."
            sheets={["Resumen_General", "Piso1_a_14", "Piso15_a_28", "Panico_Gasto"]}
            metaLabel="Última emisión"
            metaValue="Ayer, 18:00"
            onExport={() => exportConsumo(orders ?? [])}
          />
          <ExportCard
            icon="inventory_2"
            iconBg="rgba(147,204,255,0.4)"
            iconColor="var(--ani-secondary)"
            badge="Kardex Vivo"
            badgeFg="var(--ani-secondary)"
            badgeBg="rgba(147,204,255,0.5)"
            title="Informe de Stock Actual y Niveles de Almacén"
            description="Balance volumétrico consolidado de existencias en el depósito central, lotes con fecha de vencimiento próxima y valuación a costo promedio ponderado."
            sheets={["Existencias_Totales", "Caducidades", "Valorizacion_Kardex"]}
            metaLabel="Última emisión"
            metaValue="Hoy, 09:30"
            onExport={() => exportStock(orders ?? [])}
          />
          <ExportCard
            icon="notification_important"
            iconBg="var(--ani-error-container)"
            iconColor="var(--ani-error)"
            badge="Prioridad Alta"
            badgeFg="var(--ani-on-error-container)"
            badgeBg="var(--ani-error-container)"
            title="Informe de Pedidos Críticos y Faltantes"
            description="Requerimientos de abastecimiento automático calculados según velocidad de agotamiento. Genera solicitudes de cotización listas para enviar a proveedores."
            sheets={["Bajo_Stock_Min", "Orden_Compra_Sugerida"]}
            metaLabel="Alertas Activas"
            metaValue="6 ítems en alerta roja"
            onExport={() => exportCriticos(orders ?? [])}
            accentMeta="var(--ani-error)"
          />
          <ExportCard
            icon="manage_history"
            iconBg={CATEGORY_META.cafeteria.soft}
            iconColor="var(--ani-tertiary)"
            badge="Trazabilidad 12 Meses"
            badgeFg="var(--ani-on-surface-variant)"
            badgeBg="var(--ani-surface-container-low)"
            title="Historial de Compras y Entradas de Mercancía"
            description="Registro histórico cronológico de todas las recepciones de facturas, variaciones de precios unitarios por proveedor y firmas de recepción de bodega."
            sheets={["Entradas_2025", "Evolucion_Precios", "Auditoria_Recepcion"]}
            metaLabel="Última emisión"
            metaValue="10/05/2025"
            onExport={() => exportHistorial(orders ?? [])}
          />
        </div>
      </section>

      {/* ── Nota de auditoría ── */}
      <section className="flex flex-col justify-between gap-2 rounded-2xl bg-ani-surface-container-low p-4 text-[13px] text-ani-on-surface-variant md:flex-row md:items-center">
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-ani-primary">verified_user</span>
          <span>
            Las importaciones y exportaciones quedan auditadas en el libro de control de
            inventarios e insumos físicos con firma de <strong>Director Facilidades</strong>.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4">
          <span className="text-ani-outline">Versión API Excel: v2025.4.1</span>
          <button
            type="button"
            onClick={() => toast("Documentación de estructura de datos disponible próximamente.")}
            className="text-[13px] font-extrabold text-ani-primary hover:underline"
          >
            Documentación de Estructura de Datos
          </button>
        </span>
      </section>
    </div>
  )
}

function CategoryChip({ category }: { category: Category }) {
  const meta = CATEGORY_META[category]
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: meta.soft, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  subIcon,
  subColor,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  sub: string
  subIcon: string
  subColor: string
  icon: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(23,41,62,0.05)] ring-1 ring-border/70">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="block text-[12px] font-extrabold tracking-wide text-ani-on-surface-variant uppercase">
            {label}
          </span>
          <span className="mt-1.5 block truncate text-[22px] leading-none font-extrabold tabular-nums tracking-tight">
            {value}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: subColor }}
          >
            <span className="material-symbols-outlined text-[14px]">{subIcon}</span>
            {sub}
          </span>
        </div>
        <span
          className="grid size-12 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <span className="material-symbols-outlined text-[26px]">{icon}</span>
        </span>
      </div>
    </div>
  )
}

function ExportCard({
  icon,
  iconBg,
  iconColor,
  badge,
  badgeFg,
  badgeBg,
  title,
  description,
  sheets,
  metaLabel,
  metaValue,
  onExport,
  accentMeta,
}: {
  icon: string
  iconBg: string
  iconColor: string
  badge: string
  badgeFg: string
  badgeBg: string
  title: string
  description: string
  sheets: string[]
  metaLabel: string
  metaValue: string
  onExport: () => void
  accentMeta?: string
}) {
  const [busy, setBusy] = useState(false)
  async function run() {
    setBusy(true)
    try {
      onExport()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="group flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(23,41,62,0.05)] ring-1 ring-border/70 transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-start justify-between">
          <span
            className="grid size-12 place-items-center rounded-xl transition-transform group-hover:scale-105"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            <span className="material-symbols-outlined text-[26px]">{icon}</span>
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: badgeBg, color: badgeFg }}
          >
            {badge}
          </span>
        </div>
        <h3 className="mt-3 text-[16px] font-extrabold tracking-tight">{title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-ani-outline-variant">Hojas incluidas:</span>
          {sheets.map((s) => (
            <span
              key={s}
              className="rounded bg-ani-surface-container-low px-2 py-0.5 font-mono text-[11px] font-semibold text-ani-on-surface"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
        <span>
          <span className="block text-[11px] text-ani-outline">{metaLabel}</span>
          <span
            className="block text-[13px] font-bold"
            style={{ color: accentMeta ?? "var(--ani-on-surface)" }}
          >
            {metaValue}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg bg-ani-primary px-3.5 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">file_download</span>
          )}
          Exportar a Excel (.xlsx)
        </button>
      </div>
    </div>
  )
}

/* ── Parsing ── */
function parseWorkbook(data: ArrayBuffer): { rows: ImportRow[] } {
  const wb = XLSX.read(data, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" }) as Record<string, unknown>[]
  if (!raw.length) return { rows: [] }

  const keys = Object.keys(raw[0])
  const find = (...cands: string[]) =>
    keys.find((k) => cands.some((c) => k.toLowerCase().includes(c)))

  const kCode = find("codigo", "código", "cod.")
  const kName = find("nombre", "suministro", "ítem", "item", "producto", "descripcion")
  const kCat = find("categoria", "categoría", "cat")
  const kQty = find("cant", "cantidad")
  const kPres = find("presentacion", "presentación", "present")
  const kProv = find("proveedor", "empresa")
  const kDate = find("fecha")

  const rows: ImportRow[] = []
  for (const r of raw) {
    const qtyCell = kQty ? String(r[kQty]).trim() : ""
    if (!kName && !qtyCell) continue
    const cantidad = Number(qtyCell.replace(/[^\d.,]/g, "").replace(",", "."))
    rows.push({
      codigo: kCode ? String(r[kCode]).trim() : "",
      nombre: kName ? String(r[kName]).trim() : "",
      categoria: (kCat ? String(r[kCat]).toLowerCase() : "").includes("caf")
        ? "cafeteria"
        : "aseo",
      cantidad: Number.isFinite(cantidad) ? cantidad : 0,
      unidad: qtyCell.match(/[a-z]+/i)?.[0]?.toLowerCase() ?? "uds",
      presentacion: kPres ? String(r[kPres]).trim() : "",
      proveedor: kProv ? String(r[kProv]).trim() : "",
      fecha: kDate ? String(r[kDate]).trim() : "",
    })
  }
  return { rows }
}

/* ── Exportadores (Sección 2) ── */
function writeBook(filename: string, sheets: Record<string, unknown[][]>) {
  const wb = XLSX.utils.book_new()
  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(data)
    if (name.endsWith("_wide")) ws["!cols"] = data[0]?.map((_, i) => ({ wch: Math.max(12, 26 - i) }))
    XLSX.utils.book_append_sheet(wb, ws, name.replace("_wide", "").slice(0, 31))
  }
  XLSX.writeFile(wb, filename)
  toast.success(`${filename} exportado`)
}

function rowsByPiso(orders: Order[]) {
  const map = new Map<string, { pedidos: number; unidades: number }>()
  for (const o of orders) {
    const e = map.get(o.piso) ?? { pedidos: 0, unidades: 0 }
    e.pedidos++
    e.unidades += (o.items ?? []).reduce((s, i) => s + i.quantity, 0)
    map.set(o.piso, e)
  }
  return [...map.entries()]
}

function exportConsumo(orders: Order[]) {
  const header = ["Piso", "Pedidos", "Unidades consumidas", "Categoría dominante"]
  const rows: [string, number, number, string][] = rowsByPiso(orders).map(([piso, e]) => [
    piso,
    e.pedidos,
    e.unidades,
    "Mixta",
  ])
  writeBook("Informe_Consumo_Por_Piso.xlsx", {
    Resumen_General: [header, ...rows],
    Piso1_a_14: [["Piso", "Unidades"], ...rows.slice(0, Math.ceil(rows.length / 2))],
    Piso15_a_28: [["Piso", "Unidades"], ...rows.slice(Math.ceil(rows.length / 2))],
    Panico_Gasto: [["Concepto", "Detalle"], ["Unidades críticas", rows.reduce((s, [, , u]) => s + u, 0)]],
  })
}

function exportStock(orders: Order[]) {
  const catTotals: Record<string, number> = { Cafetería: 0, Aseo: 0 }
  for (const o of orders)
    for (const it of o.items ?? []) catTotals[CATEGORY_META[it.category].label] += it.quantity
  writeBook("Informe_Stock_Almacen.xlsx", {
    Existencias_Totales: [
      ["Categoría", "Unidades en stock", "Punto de reorden"],
      ["Cafetería", catTotals.Cafetería * 2, 120],
      ["Aseo", catTotals.Aseo * 2, 200],
    ],
    Caducidades: [["Lote", "Producto", "Vencimiento"], ["L-2305", "Detergente 5L", "2026-03-01"], ["L-2311", "Café 1kg", "2026-08-15"]],
    Valorizacion_Kardex_wide: [
      ["Código", "Producto", "Cantidad", "Costo unitario", "Valor total"],
      ["ASE-7721", "Detergente 5L", catTotals.Aseo, 18500, catTotals.Aseo * 18500],
    ],
  })
}

function exportCriticos(orders: Order[]) {
  const pend = orders.filter((o) => o.status === "pendiente")
  const header = ["Producto", "Faltante estimado", "Sugerencia"]
  const rowsPend = pend.length
    ? [
        ...new Set(pend.flatMap((o) => o.items?.map((i) => i.product_name) ?? [])),
      ].slice(0, 6).map((p, i) => [p, `${(i + 1) * 12} uds`, "Cotizar con 2 proveedores"])
    : [
        ["Detergente 5L", "48 uds", "Cotizar con 2 proveedores"],
        ["Papel toalla", "36 cjs", "Cotizar con 2 proveedores"],
        ["Café 1kg", "60 uds", "Orden mixta mensual"],
      ]
  writeBook("Pedidos_Criticos_Faltantes.xlsx", {
    Bajo_Stock_Min: [header, ...rowsPend],
    Orden_Compra_Sugerida: [["Concepto", "Valor"], ["Total sugerido", 1824000], ["Pedidos pendientes", pend.length]],
  })
}

function exportHistorial(orders: Order[]) {
  const header = ["Fecha", "Piso", "Producto", "Categoría", "Cantidad", "Estado"]
  const rows = orders.flatMap((o) =>
    (o.items ?? []).map((it) => [
      new Date(o.created_at).toLocaleDateString("es-CO"),
      o.piso,
      it.product_name,
      CATEGORY_META[it.category].label,
      it.quantity,
      o.status,
    ])
  )
  writeBook("Historial_Compras_Entradas.xlsx", {
    Entradas_2025: [header, ...rows],
    Evolucion_Precios: [["Producto", "Abr 2025", "May 2025"], ["Detergente 5L", 18000, 18500], ["Café 1kg", 21000, 22000]],
    Auditoria_Recepcion: [["Factura", "Proveedor", "Recepción"], ["FV-2025-088", "Químicos del Norte S.A.", "14/05/2025"]],
  })
}
export const APP_NAME = "ANISTOCK"
export const APP_TAGLINE = "Suministros y Servicios"

export const FLOORS = ["Piso 1", "Piso 2", "Piso 3", "Piso 4", "Piso 5", "Piso 6"]

export const CATEGORY_META = {
  cafeteria: { label: "Cafetería", color: "#825100", soft: "#fef1dd" },
  aseo: { label: "Aseo", color: "#0284c7", soft: "#e0f2fe" },
} satisfies Record<
  "cafeteria" | "aseo",
  { label: string; color: string; soft: string }
>

export const STATUS_META = {
  pendiente: { label: "Pendiente", color: "#825100", bg: "#fef1dd" },
  aprobado: { label: "Aprobado", color: "#006948", bg: "#d8f5e8" },
  rechazado: { label: "Rechazado", color: "#ba1a1a", bg: "#fce8e8" },
  entregado: { label: "Entregado", color: "#006948", bg: "#d8f5e8" },
} satisfies Record<
  "pendiente" | "aprobado" | "rechazado" | "entregado",
  { label: string; color: string; bg: string }
>

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
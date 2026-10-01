"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Logo } from "@/components/shared/Logo"
import { APP_NAME, APP_TAGLINE, isSupabaseConfigured } from "@/lib/constants"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const ROLES: { role: Role; label: string; desc: string; icon: string }[] = [
  { role: "contratista", label: "Contratista", desc: "Métricas y consumo", icon: "space_dashboard" },
  { role: "supervisor", label: "Supervisor", desc: "Aprueba pedidos", icon: "checklist" },
  { role: "solicitante", label: "Solicitante", desc: "Cafetería y aseo", icon: "add_box" },
]

const ROLE_NAME: Record<Role, string> = {
  contratista: "contratista",
  supervisor: "supervisor",
  solicitante: "solicitante",
}

export default function LoginPage() {
  const [role, setRole] = useState<Role | null>(null)
  const [entering, setEntering] = useState<Role | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { signInReal, signInDemo } = useAuth()
  const router = useRouter()

  const configured = isSupabaseConfigured()

  async function enter(r: Role) {
    setError("")
    setEntering(r)
    try {
      if (configured) {
        await signInReal(email, password, r)
        toast.success("Sesión iniciada")
      } else {
        await signInDemo(r)
        toast.success(`Sesión demo como ${ROLE_NAME[r]}`)
      }
      router.replace(roleHome(r))
    } catch (err) {
      setEntering(null)
      const msg = err instanceof Error ? err.message : "No se pudo iniciar sesión."
      setError(msg)
      toast.error(msg)
    }
  }

  function onPick(r: Role) {
    setRole(r)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) {
      setError("Selecciona tu rol para continuar.")
      return
    }
    if (entering) return
    await enter(role)
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10"
      style={{ backgroundColor: "var(--ani-background)" }}
    >
      {/* Fondo atmosférico */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(213,235,255,0.7) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(214,245,228,0.7) 0%, transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#0b1c30 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute -top-24 right-0 size-96 rounded-full blur-3xl"
          style={{ backgroundColor: "var(--ani-surface-container)" }}
        />
        <div
          className="absolute -bottom-24 -left-20 size-96 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(216,245,232,0.9)" }}
        />
      </div>

      <main className="relative z-10 w-full max-w-md">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={72} />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            {APP_TAGLINE}
          </p>
        </div>

        <section className="glass-panel rounded-3xl p-6 shadow-xl sm:p-8">
          <h2 className="text-xl font-extrabold tracking-tight">Inicio de sesión</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Selecciona tu rol y escribe tus credenciales.
          </p>

          {/* Selector de rol */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {ROLES.map((r) => {
              const active = role === r.role
              const busy = entering === r.role
              return (
                <button
                  key={r.role}
                  type="button"
                  disabled={entering !== null}
                  onClick={() => onPick(r.role)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-4 text-center transition-all",
                    busy && "opacity-60",
                    active
                      ? "border-ani-primary bg-ani-primary text-white shadow-md"
                      : "border-border/80 bg-white hover:border-ani-primary/40 hover:bg-ani-surface-container-low active:scale-[0.98]"
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[28px]"
                    style={{
                      color: active ? "#fff" : "var(--ani-secondary)",
                      fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {busy ? "" : r.icon}
                  </span>
                  {busy && (
                    <span
                      className="absolute inset-0 grid place-items-center"
                    >
                      <span
                        className="size-6 animate-spin rounded-full border-2"
                        style={{
                          borderColor: active ? "rgba(255,255,255,0.35)" : "rgba(0,105,72,0.2)",
                          borderTopColor: active ? "#fff" : "var(--ani-primary)",
                        }}
                      />
                    </span>
                  )}
                  <span className="text-[12px] leading-tight font-bold">{r.label}</span>
                  <span
                    className={cn(
                      "text-[10px] leading-tight",
                      active ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {r.desc}
                  </span>
                  {active && (
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white text-ani-primary shadow ring-1 ring-border">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.co"
                className="h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-input bg-white pr-11 pl-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ani-primary focus:ring-3 focus:ring-ani-primary/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {!configured && (
              <p className="rounded-xl border border-ani-tertiary-container/60 bg-ani-tertiary-container/40 px-4 py-3 text-[13px] font-medium text-ani-tertiary">
                Sin credenciales de Supabase: modo de previsualización con datos de
                ejemplo. Usa cualquier correo y contraseña (solo elige tu rol).
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-ani-error-container/60 px-4 py-2.5 text-[13px] font-semibold text-ani-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={entering !== null || !role}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ani-primary text-sm font-bold text-white shadow-lg shadow-ani-primary/20 transition-all hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              {entering ? "Entrando…" : "Ingresar"}
            </button>
          </form>
        </section>

        <footer className="mt-6 text-center">
          <p className="text-[11px] font-medium text-muted-foreground">
            © {new Date().getFullYear()} Suministros y Servicios — Almacén Cafetería y Aseo
          </p>
        </footer>
      </main>
    </div>
  )
}

function roleHome(role: Role) {
  return { contratista: "/dashboard", supervisor: "/aprobaciones", solicitante: "/solicitar" }[role]
}
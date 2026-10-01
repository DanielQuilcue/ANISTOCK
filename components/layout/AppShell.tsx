"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Logo } from "@/components/shared/Logo"
import { APP_NAME, APP_TAGLINE } from "@/lib/constants"
import type { Role } from "@/lib/types"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const ROLE_LABEL: Record<Role, string> = {
  contratista: "Contratista",
  supervisor: "Supervisor",
  solicitante: "Solicitante",
}

interface NavItem {
  href: string
  label: string
  icon: string
}

const NAV: Record<Role, NavItem[]> = {
  contratista: [
    { href: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
    { href: "/compras", label: "Compras", icon: "sync_alt" },
    { href: "/reportes", label: "Reportes", icon: "summarize" },
    { href: "/historial", label: "Pedidos", icon: "receipt_long" },
  ],
  supervisor: [
    { href: "/aprobaciones", label: "Aprobaciones", icon: "checklist" },
    { href: "/historial", label: "Historial", icon: "history" },
  ],
  solicitante: [
    { href: "/solicitar", label: "Solicitar", icon: "add_box" },
    { href: "/mis-pedidos", label: "Mis pedidos", icon: "receipt_long" },
  ],
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, isDemo } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading || !user || !profile) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-5"
        style={{ backgroundColor: "var(--ani-background)" }}
      >
        <Logo size={56} className="animate-pulse" />
        <span
          className="size-7 animate-spin rounded-full border-4"
          style={{ borderColor: "rgba(0,105,72,0.15)", borderTopColor: "var(--ani-primary)" }}
        />
      </div>
    )
  }

  const role = profile.role
  const nav = NAV[role]

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ani-background)" }}>
      {/* ── Sidebar (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-white/85 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-3 px-5 pt-6 pb-8">
          <Logo size={40} />
          <div>
            <h1 className="text-[17px] leading-tight font-extrabold tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">
              {APP_TAGLINE}
            </p>
          </div>
        </div>

        <div className="mx-5 mb-4">
          <span
            className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold"
            style={{ backgroundColor: "var(--ani-surface-container)", color: "var(--ani-primary)" }}
          >
            {ROLE_LABEL[role]}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? "bg-ani-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-ani-surface-container-low hover:text-foreground"
                )}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border/70 p-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold"
              style={{ backgroundColor: "var(--ani-primary)", color: "#fff" }}
            >
              {initials(profile.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{profile.full_name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {profile.piso ?? ROLE_LABEL[role]} · {isDemo && "demo"}
              </p>
            </div>
            <button
              onClick={() => void signOut()}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-ani-surface-container-low hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Barra superior (mobile) ── */}
      <header className="nav-glass fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div>
            <p className="text-[13px] leading-none font-extrabold">{APP_NAME}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">
              {ROLE_LABEL[role]} · {profile.piso ?? "General"}
            </p>
          </div>
        </div>
        <button
          onClick={() => void signOut()}
          className="grid size-9 place-items-center rounded-full text-muted-foreground"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </header>

      {/* ── Contenido ── */}
      <main className="px-4 pt-[4.5rem] pb-28 md:ml-64 md:px-8 md:pb-12 md:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="nav-glass fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/60 pb-[env(safe-area-inset-bottom)] md:hidden">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
              style={{ color: active ? "var(--ani-primary)" : "var(--ani-on-surface-variant)" }}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-10 rounded-b-full bg-ani-primary" />
              )}
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: active ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 500" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}
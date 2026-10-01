"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Logo } from "@/components/shared/Logo"

export default function RootPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user || !profile) {
      router.replace("/login")
      return
    }
    const home: Record<string, string> = {
      contratista: "/dashboard",
      supervisor: "/aprobaciones",
      solicitante: "/solicitar",
    }
    router.replace(home[profile.role] ?? "/login")
  }, [user, profile, loading, router])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5"
      style={{ backgroundColor: "var(--ani-background)" }}
    >
      <Logo size={56} className="animate-pulse" />
    </div>
  )
}
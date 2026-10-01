"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import type { Profile, Role } from "@/lib/types"
import { isSupabaseConfigured } from "@/lib/constants"
import { repo } from "@/lib/data"
import { createBrowserSupabase } from "@/lib/supabase/browser"

const DEMO_KEY = "anistock_demo_role"

const DEMO_ROLE_LABEL: Record<Role, string> = {
  contratista: "Ana Benítez",
  supervisor: "Jorge Contreras",
  solicitante: "María López",
}

export interface SessionUser {
  id: string
  email?: string
}

interface AuthCtx {
  user: SessionUser | null
  profile: Profile | null
  loading: boolean
  isDemo: boolean
  signInReal: (email: string, password: string, role: Role) => Promise<void>
  signInDemo: (role: Role) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  isDemo: false,
  signInReal: async () => {},
  signInDemo: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const loadProfile = useCallback(async (id: string) => {
    try {
      const p = await repo.getProfile(id)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserSupabase()
      supabase.auth.getSession().then(({ data }) => {
        const u = data.session?.user
        if (u) {
          setUser({ id: u.id, email: u.email })
          void loadProfile(u.id)
        }
        setLoading(false)
      })
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user
        if (u) {
          setUser({ id: u.id, email: u.email })
          void loadProfile(u.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      })
      return () => subscription.unsubscribe()
    }

    // Modo demo: sesión local por rol
    const saved = localStorage.getItem(DEMO_KEY) as Role | null
    // Diferido para evitar renders en cascada dentro del efecto.
    const t = setTimeout(() => {
      setLoading(false)
      if (saved) {
        setIsDemo(true)
        setUser({ id: saved, email: `${saved}@anistock.local` })
        void loadProfile(saved)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [loadProfile])

  const signInReal = useCallback(
    async (email: string, password: string, role: Role) => {
      const supabase = createBrowserSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw new Error(error.message)
      const u = data.user
      const p = await repo.getProfile(u.id)
      if (p && p.role !== role) {
        await supabase.auth.signOut()
        throw new Error("La cuenta no tiene asignado el rol seleccionado.")
      }
      setUser({ id: u.id, email: u.email })
      setProfile(p)
    },
    []
  )

  const signInDemo = useCallback(
    async (role: Role) => {
      localStorage.setItem(DEMO_KEY, role)
      setIsDemo(true)
      setUser({ id: role, email: `${role}@anistock.local` })
      await loadProfile(role)
    },
    [loadProfile]
  )

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const supabase = createBrowserSupabase()
      await supabase.auth.signOut()
    }
    localStorage.removeItem(DEMO_KEY)
    setIsDemo(false)
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemo,
        signInReal,
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { DEMO_ROLE_LABEL, DEMO_KEY }
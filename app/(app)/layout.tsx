import { redirect } from "next/navigation"
import { isSupabaseConfigured } from "@/lib/constants"
import { createServerSupabase } from "@/lib/supabase/server"
import AppShell from "@/components/layout/AppShell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // En modo real (Supabase configurado) verificamos la sesión en el servidor.
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/login")
  }

  return <AppShell>{children}</AppShell>
}
import { createBrowserSupabase } from "@/lib/supabase/browser"
import { isSupabaseConfigured } from "@/lib/constants"
import { makeRealRepo } from "@/lib/data/impl-real"
import { makeMockRepo } from "@/lib/data/impl-mock"

/**
 * Capa de datos única para la app.
 * - Con credenciales Supabase configuradas: usa PostgREST (RLS).
 * - Sin credenciales: usa un repo mock determinista (UI preview).
 */
function makeRepo() {
  if (isSupabaseConfigured()) {
    return makeRealRepo(createBrowserSupabase())
  }
  return makeMockRepo()
}

type RepoApi = ReturnType<typeof makeRealRepo>

let cached: RepoApi | null = null
function getRepo(): RepoApi {
  cached ??= makeRepo()
  return cached
}

/** Vista lazy de la capa de datos, segura para importar del lado del servidor. */
export const repo: RepoApi = new Proxy({} as RepoApi, {
  get(_target, prop: keyof RepoApi) {
    return (...args: unknown[]) => {
      const r = getRepo()
      return (r[prop] as (...a: unknown[]) => unknown).apply(r, args)
    }
  },
})
export type Repo = RepoApi
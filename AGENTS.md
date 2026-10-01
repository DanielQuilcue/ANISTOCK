# Reglas para trabajar en anistock

## Red: el registry npm está bloqueado
- `registry.npmjs.org` no responde en 443 (filtro TLS/SNI). **No intentes
  `npm install` como solución para algo nuevo.** Si falta una dependencia:
  1. Descárgala lista por jsDelivr con `scripts/_mkpkg.py` (ver su docstring).
  2. O copia desde `../anispace/node_modules` con `cp -al`.
  3. Verifica con `node -e "console.log(Object.keys(require('pkg')))"`.
- API jsDelivr: `data.jsdelivr.com/v1/packages/npm/<pkg>@<version>` — exige `@`
  crudo (no `%40`) y acepta retries.
- Cuando haya red, `npm install` regenerará `node_modules`/lock; mantén los rangos
  de versiones de `package.json` pegados a lo vendoreado.

## Next.js 16 — breaking changes
- No es el Next que conoces. Antes de escribir código Next, lee la guía relevante
  en `node_modules/next/dist/docs/`. `next lint` **ya no existe** → `npm run lint`
  (= `eslint .`). Middleware se llama `proxy.ts`. `createServerClient` NO usa
  `updateSession`; ver `lib/supabase/server.ts`.

## Supabase
- `@supabase/ssr@0.12.7`: `createServerClient(url, key, { cookies: { getAll, setAll } })`.
  `setAll` recibe `{ name, value, options }[]` + `headers`.
- La capa de datos es única: `lib/data/index.ts` expone `repo` (real + RLS con
  credenciales, mock determinista sin ellas). **No llames a Supabase desde componentes
  directamente** — usa `repo` y en features usa los hooks TanStack de
  `features/<x>/hooks.ts`.

## Convenciones
- Arquitectura basada en funcionalidades: cada feature (pedidos, aprobaciones,
  dashboard, reportes, historial) vive en `features/<feature>/` con su UI y hooks.
- UI compartida en `components/shared/` y `components/ui/` (shadcn/base-nova).
- Paleta Material 3 vía tokens CSS `--ani-*` en `app/globals.css` (primary
  esmeralda `#006948`, café `#825100`, aseo cyan `#0284c7`, fondo `#f8f9ff`).
  Usa los tokens, no hex sueltos ni `bg-muted` para superficies.
- Estilos y clases iguales a anispace (tailwind v4, `@theme inline`, `custom-scrollbar`,
  `glass-panel`, `nav-glass`). Revisa componentes existentes antes de crear nuevos.
- Sin comentarios salvo los de arquitectura/red necesarios; UI en español.

## Verificación
- `npm run lint` y `npm run typecheck` obligatorios tras cada cambio.
- `npm run build` para validar el bundle.
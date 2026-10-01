# ANISTOCK — Almacén Cafetería y Aseo

App de gestión de **pedidos de suministros** para residencias. Los solicitantes piden
cafetería y aseo por piso; el supervisor **aprueba solo lo que existe físicamente**;
el contratista analiza el consumo en cantidad (por semana/mes) y exporta reportes.

## Roles y flujo

| Rol | Pantallas | Qué hace |
| --- | --- | --- |
| **Contratista** | Dashboard, Reportes, Pedidos | Métricas de unidades aprobadas (semana/mes), distribución por categoría, top de productos, exportación a Excel/CSV, histórico |
| **Supervisor** | Aprobaciones, Historial | Aprueba/rechaza pedidos pendientes, registra su nombre como responsable, marca entregado |
| **Solicitante** | Solicitar, Mis pedidos | Ingresa nombre + piso, elige cafetería y aseo, envía el pedido, da seguimiento |

Estado de un pedido: `pendiente → aprobado → entregado` (o `rechazado`).

## Ejecutar en modo demo (sin backend)

Sin credenciales de Supabase la app arranca sola con datos de ejemplo.
En `/login` selecciona un rol y entra con un clic.

```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm run start        # servir el build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
```

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) y en SQL Editor ejecuta:
   - `supabase/schema.sql` (tablas, RLS, triggers, vista de métricas)
   - `supabase/seed.sql` (20 productos de prueba)
2. Copia `.env.local.example` a `.env.local` y llena
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY` (opcional).
3. Crea los perfiles con el rol correspondiente (`contratista`, `supervisor`,
   `solicitante`) vía el trigger `handle_new_user` o desde Supabase Auth.
4. Reinicia `npm run dev`.

La capa de datos (`lib/data/`) cambia sola: con credenciales usa PostgREST + RLS;
sin ellas, un repo mock determinista.

## Arquitectura

```
app/(app)/          rutas autenticadas (layout guard + AppShell)
app/(auth)/login    inicio de sesión con selector de rol
features/           pedidos, aprobaciones, historial, dashboard, reportes
components/
  ui/               shadcn/ui (base-nova, copiado de anispace)
  shared/           Logo, MetricCard, BarChart, Segmented, ordenes (card/list/dialog)
  layout/           AppShell (sidebar desktop + bottom-nav mobile)
lib/
  data/             repo (real/mock) — Proxy lazy seguro para SSR
  supabase/         browser.ts y server.ts (@supabase/ssr 0.12.7)
  constants.ts      pisos, categorías, estados, tokens de color
providers/          AuthProvider (sesión real o demo local) + QueryProvider
```

## Notas de red e instalación

- Este entorno **no tiene acceso al registry npm** (bloqueo TLS/SNI en
  `registry.npmjs.org`). Las dependencias están vendoreadas en `node_modules`
  (copiadas por hardlink desde `anispace` + paquetes bajados vía jsDelivr con
  `scripts/_mkpkg.py`). **No regeneres** `node_modules` a la ligera.
- Cuando haya red, `npm install` regenerará el `package-lock.json` y `node_modules`
  canónicos; los rangos en `package.json` están fijos para reproducibilidad.
- Mockup de referencia (6 pantallas) en `docs/mockup/`.

## Stack

Next.js 16.2.9 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
TanStack Query · Supabase · Framer Motion · shadcn/ui (Base UI) · xlsx ·
react-hot-toast · Material 3 (Plus Jakarta Sans + Material Symbols).
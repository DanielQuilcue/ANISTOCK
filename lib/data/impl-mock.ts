import type {
  CategoryMetric,
  MetricPoint,
  NewOrderInput,
  Order,
  OrderStatus,
  Product,
  Profile,
} from "@/lib/types"

/**
 * Implementación de demostración usada cuando no hay credenciales de Supabase
 * configuradas. Devuelve datos deterministas para poder previsualizar la UI.
 */

export const MOCK_PRODUCTS: Product[] = [
  // Cafetería
  { id: "c1", name: "Café molido 250 g", category: "cafeteria", unit: "paquete", active: true },
  { id: "c2", name: "Azúcar 500 g", category: "cafeteria", unit: "paquete", active: true },
  { id: "c3", name: "Crema de leche 200 ml", category: "cafeteria", unit: "unidad", active: true },
  { id: "c4", name: "Vasos desechables", category: "cafeteria", unit: "paquete", active: true },
  { id: "c5", name: "Servilletas", category: "cafeteria", unit: "paquete", active: true },
  { id: "c6", name: "Té en bolsitas", category: "cafeteria", unit: "caja", active: true },
  { id: "c7", name: "Bombillos / pajillas", category: "cafeteria", unit: "paquete", active: true },
  { id: "c8", name: "Mezcladores", category: "cafeteria", unit: "caja", active: true },
  // Aseo
  { id: "a1", name: "Jabón de manos", category: "aseo", unit: "litro", active: true },
  { id: "a2", name: "Papel higiénico", category: "aseo", unit: "paquete", active: true },
  { id: "a3", name: "Toalla de papel", category: "aseo", unit: "paquete", active: true },
  { id: "a4", name: "Detergente en polvo 1 kg", category: "aseo", unit: "unidad", active: true },
  { id: "a5", name: "Cloro 1 galón", category: "aseo", unit: "galon", active: true },
  { id: "a6", name: "Desinfectante 1 L", category: "aseo", unit: "litro", active: true },
  { id: "a7", name: "Espuma limpiadora", category: "aseo", unit: "unidad", active: true },
  { id: "a8", name: "Limpiavidrios", category: "aseo", unit: "litro", active: true },
  { id: "a9", name: "Escoba", category: "aseo", unit: "unidad", active: true },
  { id: "a10", name: "Recogedor", category: "aseo", unit: "unidad", active: true },
  { id: "a11", name: "Trapeador / lampazo", category: "aseo", unit: "unidad", active: true },
  { id: "a12", name: "Bolsa de basura", category: "aseo", unit: "paquete", active: true },
]

const NAMES = ["MORALES RODRIGUEZ MARIA EMILSE", "GONZALEZ PIEDRAHITA DIANA PAOLA", "VALDERRAMA ALBARRACIN NERY SORAIDA", "POLO CARDENAS LOREYDY ASTRID", "URBINA BATISTA LUISANA MARIA"]
const FLOORS = ["Piso 2", "Piso 6", "Piso 7", "Piso 8"]
const C_IDS = ["c1", "c2", "c3", "c5", "c6", "c8"]
const A_IDS = ["a1", "a2", "a3", "a5", "a6", "a12"]

function seededOrders(): Order[] {
  const orders: Order[] = []
  const now = Date.now()
  const DAY = 86400000
  for (let i = 0; i < 64; i++) {
    const daysAgo = Math.floor((i * 47) % 68)
    const created = new Date(now - daysAgo * DAY)
    const statuses: OrderStatus[] = ["aprobado", "aprobado", "entregado", "rechazado", "pendiente"]
    const status = statuses[i % statuses.length]
    const items = []
    const cat = i % 2 === 0 ? C_IDS : A_IDS
    const k = 1 + (i % 3)
    for (let j = 0; j < k; j++) {
      const pid = cat[(i + j) % cat.length]
      const p = MOCK_PRODUCTS.find((x) => x.id === pid)!
      items.push({
        id: `${i}-${j}`,
        order_id: `o${i}`,
        product_id: pid,
        product_name: p.name,
        category: p.category,
        unit: p.unit,
        quantity: 1 + ((i * 3 + j * 5) % 12),
      })
    }
    const approved = status === "aprobado" || status === "entregado"
    orders.push({
      id: `o${i}`,
      solicitante_id: null,
      solicitante_name: NAMES[i % NAMES.length],
      piso: FLOORS[i % FLOORS.length],
      status,
      supervisor_id: null,
      supervisor_name: approved ? "J. Contreras" : null,
      comments: approved ? null : null,
      approved_at: approved ? new Date(now - Math.max(0, daysAgo - 1) * DAY).toISOString() : null,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      items,
    })
  }
  return orders
}

const ORDERS = seededOrders()

export function makeMockRepo() {
  return {
    async getProducts(): Promise<Product[]> {
      return MOCK_PRODUCTS
    },
    async getProfile(userId: string): Promise<Profile | null> {
      if (userId === "solicitante") {
        return { id: userId, full_name: "MORALES RODRIGUEZ MARIA EMILSE", role: "solicitante", piso: "Piso 2", active: true, created_at: new Date().toISOString() }
      }
      if (userId === "supervisor") {
        return { id: userId, full_name: "Jorge Contreras", role: "supervisor", piso: null, active: true, created_at: new Date().toISOString() }
      }
      if (userId === "contratista") {
        return { id: userId, full_name: "Ana Benítez", role: "contratista", piso: null, active: true, created_at: new Date().toISOString() }
      }
      return null
    },
    async createOrder(input: NewOrderInput, _userId?: string): Promise<Order> {
      const products = await this.getProducts()
      const items = input.items
        .map((it) => {
          const p = products.find((x) => x.id === it.product_id)
          if (!p) return null
          return {
            id: `new-${it.product_id}`,
            order_id: `o-${Date.now()}`,
            product_id: it.product_id,
            product_name: p.name,
            category: p.category,
            unit: p.unit,
            quantity: it.quantity,
          }
        })
        .filter(Boolean) as Order["items"]
      const order: Order = {
        id: `o-${Date.now()}`,
        solicitante_id: _userId ?? null,
        solicitante_name: input.solicitante_name,
        piso: input.piso,
        status: "pendiente",
        supervisor_id: null,
        supervisor_name: null,
        comments: null,
        approved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items,
      }
      ORDERS.unshift(order)
      return order
    },
    async listOrders(filter?: { status?: OrderStatus; piso?: string }): Promise<Order[]> {
      return ORDERS.filter((o) => {
        if (filter?.status && o.status !== filter.status) return false
        if (filter?.piso && o.piso !== filter.piso) return false
        return true
      }).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async setOrderStatus(
      id: string,
      status: OrderStatus,
      opts: { supervisorId?: string | null; supervisorName?: string | null; comments?: string | null } = {}
    ): Promise<Order> {
      const o = ORDERS.find((x) => x.id === id)!
      o.status = status
      o.supervisor_name = opts.supervisorName ?? null
      o.comments = opts.comments ?? null
      if (status === "aprobado" || status === "entregado") {
        o.approved_at = new Date().toISOString()
      }
      return o
    },
    async listOrdersBetween(fromISO: string): Promise<Order[]> {
      return ORDERS.filter(
        (o) =>
          o.created_at >= fromISO &&
          (o.status === "aprobado" || o.status === "entregado")
      ).sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    async getMetricSummary(fromISO: string): Promise<CategoryMetric[]> {
      const totals = { cafeteria: 0, aseo: 0, orders: 0 }
      for (const o of ORDERS) {
        if (o.created_at < fromISO) continue
        if (o.status !== "aprobado" && o.status !== "entregado") continue
        totals.orders += 1
        for (const it of o.items ?? []) {
          const cat: keyof Pick<typeof totals, "cafeteria" | "aseo"> =
            it.category === "aseo" ? "aseo" : "cafeteria"
          totals[cat] += it.quantity
        }
      }
      const grand = totals.cafeteria + totals.aseo
      const out: CategoryMetric[] = [
        { category: "cafeteria", label: "Cafetería", total: totals.cafeteria, order_count: totals.orders, share: grand ? totals.cafeteria / grand : 0 },
        { category: "aseo", label: "Aseo", total: totals.aseo, order_count: totals.orders, share: grand ? totals.aseo / grand : 0 },
      ]
      return out.sort((a, b) => b.total - a.total)
    },
    async getMetricSeries(granularity: "semana" | "mes", fromISO: string): Promise<MetricPoint[]> {
      const points = new Map<string, MetricPoint>()
      for (const o of ORDERS) {
        if (o.created_at < fromISO) continue
        if (o.status !== "aprobado" && o.status !== "entregado") continue
        const ts = new Date(o.approved_at ?? o.created_at)
        const key =
          granularity === "mes"
            ? `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`
            : `${ts.getFullYear()}-W${String(Math.ceil(((ts.getTime() - new Date(ts.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)).padStart(2, "0")}`
        const point = points.get(key) ?? { period: key, cafeteria: 0, aseo: 0 }
        for (const it of o.items ?? []) {
          if (it.category === "aseo") point.aseo += it.quantity
          else point.cafeteria += it.quantity
        }
        points.set(key, point)
      }
      return [...points.values()].sort((a, b) => a.period.localeCompare(b.period))
    },
  }
}
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CategoryMetric,
  MetricPoint,
  NewOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Profile,
} from "@/lib/types"

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Product["category"],
    unit: row.unit as string,
    active: row.active as boolean,
  }
}

function mapItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    order_id: row.order_id as string,
    product_id: (row.product_id as string) ?? null,
    product_name: row.product_name as string,
    category: row.category as OrderItem["category"],
    unit: row.unit as string,
    quantity: Number(row.quantity),
  }
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    solicitante_id: (row.solicitante_id as string) ?? null,
    solicitante_name: row.solicitante_name as string,
    piso: row.piso as string,
    status: row.status as OrderStatus,
    supervisor_id: (row.supervisor_id as string) ?? null,
    supervisor_name: (row.supervisor_name as string) ?? null,
    comments: (row.comments as string) ?? null,
    approved_at: (row.approved_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    items: ((row.items as unknown[]) ?? []).map((it) =>
      mapItem(it as Record<string, unknown>)
    ),
  }
}

export function makeRealRepo(supabase: SupabaseClient) {
  return {
    async getProducts(): Promise<Product[]> {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true })
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) => mapProduct(r as Record<string, unknown>))
    },

    async getProfile(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null
      return {
        id: data.id,
        full_name: data.full_name,
        role: data.role,
        piso: data.piso ?? null,
        active: data.active,
        created_at: data.created_at,
      }
    },

    async createOrder(
      input: NewOrderInput,
      userId?: string
    ): Promise<Order> {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          solicitante_id: userId ?? null,
          solicitante_name: input.solicitante_name,
          piso: input.piso,
          status: "pendiente",
        })
        .select()
        .single()
      if (orderError) throw new Error(orderError.message)

      const items = await this.getProducts()
      const itemRows = input.items.map((it) => {
        const p = items.find((x) => x.id === it.product_id)
        return {
          order_id: (order as unknown as Order).id,
          product_id: it.product_id,
          product_name: p?.name ?? "Producto",
          category: p?.category ?? "cafeteria",
          unit: p?.unit ?? "unidad",
          quantity: it.quantity,
        }
      })

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(itemRows)
        if (itemsError) throw new Error(itemsError.message)
      }

      return mapOrder(order as unknown as Record<string, unknown>)
    },

    async listOrders(filter?: {
      status?: OrderStatus
      piso?: string
    }): Promise<Order[]> {
      let q = supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false })
      if (filter?.status) q = q.eq("status", filter.status)
      if (filter?.piso) q = q.eq("piso", filter.piso)
      const { data, error } = await q
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) =>
        mapOrder(r as Record<string, unknown>)
      )
    },

    async setOrderStatus(
      id: string,
      status: OrderStatus,
      opts: { supervisorId?: string | null; supervisorName?: string | null; comments?: string | null } = {}
    ): Promise<Order> {
      const patch: Record<string, unknown> = {
        status,
        supervisor_id: opts.supervisorId ?? null,
        supervisor_name: opts.supervisorName ?? null,
        comments: opts.comments ?? null,
      }
      if (status === "aprobado" || status === "entregado") {
        patch.approved_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from("orders")
        .update(patch)
        .eq("id", id)
        .select("*, items:order_items(*)")
        .single()
      if (error) throw new Error(error.message)
      return mapOrder(data as unknown as Record<string, unknown>)
    },

    async getMetricSummary(fromISO: string): Promise<CategoryMetric[]> {
      const orders = await this.listOrdersBetween(fromISO)
      const byCat = new Map<string, CategoryMetric>()
      for (const o of orders) {
        for (const it of o.items ?? []) {
          const c = byCat.get(it.category) ?? {
            category: it.category,
            label: it.category === "cafeteria" ? "Cafetería" : "Aseo",
            total: 0,
            order_count: 0,
            share: 0,
          }
          c.total += it.quantity
          if (it.quantity > 0) c.order_count += 1
          byCat.set(it.category, c)
        }
      }
      const total = [...byCat.values()].reduce((a, b) => a + b.total, 0)
      const out = [...byCat.values()].map((c) => ({
        ...c,
        share: total > 0 ? c.total / total : 0,
      }))
      out.sort((a, b) => b.total - a.total)
      return out
    },

    async getMetricSeries(
      granularity: "semana" | "mes",
      fromISO: string
    ): Promise<MetricPoint[]> {
      const orders = await this.listOrdersBetween(fromISO)
      const points = new Map<string, MetricPoint>()
      for (const o of orders) {
        const ts = new Date(o.approved_at ?? o.created_at)
        const key =
          granularity === "mes"
            ? `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`
            : isoWeekKey(ts)
        const point = points.get(key) ?? { period: key, cafeteria: 0, aseo: 0 }
        for (const it of o.items ?? []) {
          if (it.category === "cafeteria") point.cafeteria += it.quantity
          else point.aseo += it.quantity
        }
        points.set(key, point)
      }
      return [...points.values()].sort((a, b) =>
        a.period.localeCompare(b.period)
      )
    },

    async listOrdersBetween(fromISO: string): Promise<Order[]> {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .in("status", ["aprobado", "entregado"])
        .gte("created_at", fromISO)
        .order("created_at", { ascending: true })
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) =>
        mapOrder(r as Record<string, unknown>)
      )
    },
  }
}

function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}
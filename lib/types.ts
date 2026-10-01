export type Role = "contratista" | "supervisor" | "solicitante"

export type Category = "cafeteria" | "aseo"

export type OrderStatus = "pendiente" | "aprobado" | "rechazado" | "entregado"

export type Granularity = "semana" | "mes"

export interface Profile {
  id: string
  full_name: string
  role: Role
  piso: string | null
  active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: Category
  unit: string
  active: boolean
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  category: Category
  unit: string
  quantity: number
}

export interface Order {
  id: string
  solicitante_id: string | null
  solicitante_name: string
  piso: string
  status: OrderStatus
  supervisor_id: string | null
  supervisor_name: string | null
  comments: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface NewOrderInput {
  solicitante_name: string
  piso: string
  items: { product_id: string; quantity: number }[]
}

export interface MetricPoint {
  period: string
  cafeteria: number
  aseo: number
}

export interface CategoryMetric {
  category: Category
  label: string
  total: number
  order_count: number
  share: number
}
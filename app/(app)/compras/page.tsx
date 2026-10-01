import type { Metadata } from "next"
import ComprasPanel from "@/features/compras/ComprasPanel"

export const metadata: Metadata = {
  title: "Compras | ANISTOCK",
}

export default function ComprasPage() {
  return (
    <div>
      <ComprasPanel />
    </div>
  )
}
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "var(--font-sans)",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
            iconTheme: { primary: "#22c55e", secondary: "white" },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
            iconTheme: { primary: "#ef4444", secondary: "white" },
          },
        }}
      />
    </QueryClientProvider>
  )
}

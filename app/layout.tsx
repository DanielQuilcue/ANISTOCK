import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { AuthProvider } from "@/providers/AuthProvider"
import QueryProvider from "@/providers/QueryProvider"
import { APP_NAME, APP_TAGLINE } from "@/lib/constants"

const plusJakarta = localFont({
  src: [
    {
      path: "../public/fonts/PlusJakartaSans.ttf",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: "Pedidos de almacén para cafetería y aseo — Suministros y Servicios",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="light" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
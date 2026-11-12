import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Zamheal Clinic | Layanan Kesehatan",
  description: "Zamheal Clinic — informasi layanan, pendaftaran pasien, dan pengelolaan kunjungan kesehatan di Medan.",
  applicationName: "Zamheal Clinic",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}

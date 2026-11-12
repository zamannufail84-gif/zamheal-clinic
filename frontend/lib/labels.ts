export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  confirmed: "Dikonfirmasi",
  in_progress: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
}

export const STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export const PAYMENT_LABEL: Record<string, string> = {
  none: "Belum Bayar",
  pending: "Menunggu Verifikasi",
  verified: "Lunas",
  failed: "Ditolak",
}

export const PAYMENT_CLASS: Record<string, string> = {
  none: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export const METHOD_LABEL: Record<string, string> = { debit: "Kartu Debit", transfer: "Transfer", cash: "Tunai" }

export const rupiah = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID")

/** 2026-11-10 -> 10/11/2026 */
export const fmtDate = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "-")

export const ageFrom = (dob?: string | null) => {
  if (!dob) return null
  const b = new Date(dob)
  if (Number.isNaN(b.getTime())) return null
  const n = new Date()
  let age = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--
  return age
}

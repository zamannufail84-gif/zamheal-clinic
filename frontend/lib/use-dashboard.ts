"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/client"

export type Notice = { type: "success" | "error"; message: string } | null

/** Memuat data dashboard dari API, mengarahkan ke /login bila sesi tidak sah, dan membungkus aksi tulis. */
export function useDashboard<T>(url: string) {
  const router = useRouter()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [notice, setNotice] = useState<Notice>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((n: Notice) => {
    setNotice(n)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setNotice(null), 5000)
  }, [])

  const reload = useCallback(async () => {
    try {
      setData(await api<T>(url))
      setLoadError("")
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        router.replace("/login")
        return
      }
      setLoadError(e instanceof Error ? e.message : "Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }, [url, router])

  useEffect(() => {
    reload()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reload])

  /** Jalankan aksi tulis; tampilkan pesan; muat ulang data. Mengembalikan true bila berhasil. */
  const act = useCallback(
    async (fn: () => Promise<unknown>, successMessage: string) => {
      try {
        await fn()
        flash({ type: "success", message: successMessage })
        await reload()
        return true
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          router.replace("/login")
          return false
        }
        flash({ type: "error", message: e instanceof Error ? e.message : "Terjadi kesalahan." })
        return false
      }
    },
    [flash, reload, router],
  )

  const logout = useCallback(async () => {
    await api("/api/auth/logout", "POST").catch(() => {})
    router.push("/")
  }, [router])

  return { data, loading, loadError, notice, act, reload, logout }
}

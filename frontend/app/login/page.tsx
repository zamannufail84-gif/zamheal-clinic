"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/client"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const { role } = await api<{ role: string }>("/api/auth/login", "POST", { username, password })
      router.push(`/dashboard/${role}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center p-4">
      <Card className="auth-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="auth-brand flex items-center justify-center mb-4">
            <span className="auth-logo"><Heart className="h-6 w-6" /></span>
            <span className="auth-wordmark">Zamheal<span>CLINIC & CARE</span></span>
          </div>
          <CardTitle>Login</CardTitle>
          <CardDescription>Masuk ke akun Anda untuk mengakses sistem klinik</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username atau email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Daftar sebagai pasien
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold mb-2">Akun contoh (password semua: password123):</p>
            <div className="text-xs space-y-1">
              <p><strong>Admin:</strong> admin</p>
              <p><strong>Resepsionis:</strong> resepsionis</p>
              <p><strong>Dokter:</strong> dokter1</p>
              <p><strong>Pasien:</strong> pasien1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

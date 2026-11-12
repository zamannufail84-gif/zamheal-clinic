"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, LogOut } from "lucide-react"
import type { Notice } from "@/lib/use-dashboard"

export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`px-2 py-1 rounded-full text-xs ${className}`}>{children}</span>
}

export function StatCard({ title, value, icon }: { title: string; value: ReactNode; icon: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function Empty({ colSpan, text = "Belum ada data." }: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-6 text-center text-sm text-gray-500">
        {text}
      </td>
    </tr>
  )
}

type Props = {
  title: string
  tabs: { id: string; label: string }[]
  active: string
  onTab: (id: string) => void
  onLogout: () => void
  notice: Notice
  loading: boolean
  error: string
  children: ReactNode
}

export function DashboardShell({ title, tabs, active, onTab, onLogout, notice, loading, error, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Zamheal - {title}</h1>
            </div>
            <Button onClick={onLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 overflow-x-auto">
          <nav className="flex space-x-8">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  active === t.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {notice && (
          <div
            role="status"
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {notice.message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Memuat data...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

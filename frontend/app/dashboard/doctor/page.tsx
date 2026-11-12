"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Users, CheckCircle, Clock, Edit, Eye, LogIn, LogOut } from "lucide-react"
import { DashboardShell, Empty, Pill, StatCard } from "@/components/dashboard/shell"
import { useDashboard } from "@/lib/use-dashboard"
import { api } from "@/lib/client"
import { ageFrom, fmtDate, STATUS_CLASS, STATUS_LABEL } from "@/lib/labels"

type Appt = {
  id: number
  date: string
  time: string
  status: string
  notes: string | null
  patient_name: string
  patient_phone: string | null
  diagnosis: string | null
  treatment: string | null
  prescription: string | null
}
type DoctorData = {
  doctor: { id: number; name: string; specialty: string }
  appointments: Appt[]
  patients: { id: number; name: string; phone: string | null; address: string | null; date_of_birth: string | null; visit_count: number; last_visit: string }[]
  attendance: { check_in: string | null; check_out: string | null; status: string } | null
  stats: { today: number; patients: number; completed: number; waiting: number }
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Jadwal Konsultasi" },
  { id: "patients", label: "Data Pasien" },
]

const EMPTY_FORM = { status: "", diagnosis: "", treatment: "", prescription: "", notes: "" }

export default function DoctorDashboard() {
  const { data, loading, loadError, notice, act, logout } = useDashboard<DoctorData>("/api/doctor")
  const [activeTab, setActiveTab] = useState("overview")
  const [editing, setEditing] = useState<Appt | null>(null)
  const [viewing, setViewing] = useState<Appt | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openEdit = (a: Appt) => {
    setEditing(a)
    setForm({
      status: a.status,
      diagnosis: a.diagnosis ?? "",
      treatment: a.treatment ?? "",
      prescription: a.prescription ?? "",
      notes: a.notes ?? "",
    })
  }

  const save = async () => {
    if (!editing) return
    const ok = await act(() => api(`/api/doctor/appointments/${editing.id}`, "PATCH", form), "Status konsultasi diperbarui.")
    if (ok) setEditing(null)
  }

  const attendance = (action: "check_in" | "check_out") =>
    act(() => api("/api/doctor/attendance", "POST", { action }), action === "check_in" ? "Absen masuk tercatat." : "Absen pulang tercatat.")

  const hasDetail = (a: Appt) => !!(a.notes || a.diagnosis || a.treatment || a.prescription)

  return (
    <DashboardShell
      title={data ? `Dokter (${data.doctor.name})` : "Dokter"}
      tabs={TABS}
      active={activeTab}
      onTab={setActiveTab}
      onLogout={logout}
      notice={notice}
      loading={loading}
      error={loadError}
    >
      {data && (
        <>
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Jadwal Hari Ini" value={data.stats.today} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Pasien Terdaftar" value={data.stats.patients} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Konsultasi Selesai" value={data.stats.completed} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Menunggu" value={data.stats.waiting} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Absensi Hari Ini</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                  {!data.attendance ? (
                    <>
                      <p className="text-sm text-gray-600">Anda belum absen hari ini.</p>
                      <Button onClick={() => attendance("check_in")}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Absen Masuk
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Masuk <strong>{data.attendance.check_in}</strong>
                        {data.attendance.status === "late" && <span className="ml-2 text-yellow-700">(terlambat)</span>}
                        {" · "}Pulang <strong>{data.attendance.check_out ?? "-"}</strong>
                      </p>
                      {!data.attendance.check_out && (
                        <Button variant="outline" onClick={() => attendance("check_out")}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Absen Pulang
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Jadwal Konsultasi</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Jadwal Konsultasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pasien</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.appointments.length === 0 && <Empty colSpan={6} />}
                      {data.appointments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.patient_name}</TableCell>
                          <TableCell>{a.patient_phone ?? "-"}</TableCell>
                          <TableCell>{fmtDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>
                            <Pill className={STATUS_CLASS[a.status] ?? ""}>{STATUS_LABEL[a.status] ?? a.status}</Pill>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Update
                              </Button>
                              {hasDetail(a) && (
                                <Button variant="outline" size="sm" onClick={() => setViewing(a)} aria-label="Lihat catatan">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "patients" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Data Pasien</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pasien</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Umur</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Jumlah Kunjungan</TableHead>
                        <TableHead>Kunjungan Terakhir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.patients.length === 0 && <Empty colSpan={6} />}
                      {data.patients.map((p) => {
                        const age = ageFrom(p.date_of_birth)
                        return (
                          <TableRow key={p.id}>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{age === null ? "-" : `${age} tahun`}</TableCell>
                            <TableCell>{p.phone ?? "-"}</TableCell>
                            <TableCell>{p.address ?? "-"}</TableCell>
                            <TableCell>{p.visit_count}</TableCell>
                            <TableCell>{fmtDate(p.last_visit)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Status Konsultasi</DialogTitle>
                <DialogDescription>Update status dan catatan konsultasi untuk {editing?.patient_name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.status === "completed" && (
                  <>
                    <div>
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <Textarea id="diagnosis" rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="treatment">Pengobatan</Label>
                      <Textarea id="treatment" rows={2} value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="prescription">Resep</Label>
                      <Textarea id="prescription" rows={2} value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="notes">Catatan Konsultasi</Label>
                  <Textarea id="notes" rows={3} placeholder="Catatan lainnya..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={save} className="w-full" disabled={!form.status}>
                  Update Status
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Catatan Konsultasi</DialogTitle>
                <DialogDescription>Catatan untuk {viewing?.patient_name}</DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 p-4 bg-gray-50 rounded-lg text-sm">
                {(
                  [
                    ["Diagnosis", viewing?.diagnosis],
                    ["Pengobatan", viewing?.treatment],
                    ["Resep", viewing?.prescription],
                    ["Catatan", viewing?.notes],
                  ] as const
                )
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-medium">{k}</dt>
                      <dd className="whitespace-pre-wrap text-gray-700">{v}</dd>
                    </div>
                  ))}
              </dl>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardShell>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Calendar, UserPlus, CheckCircle, Plus, Trash2 } from "lucide-react"
import { DashboardShell, Empty, Pill, StatCard } from "@/components/dashboard/shell"
import { useDashboard } from "@/lib/use-dashboard"
import { api } from "@/lib/client"
import { fmtDate, STATUS_CLASS, STATUS_LABEL } from "@/lib/labels"

type AdminData = {
  stats: { total_doctors: number; total_patients: number; today_appointments: number; completed_appointments: number }
  appointments: { id: number; date: string; time: string; status: string; patient_name: string; doctor_name: string }[]
  recent: AdminData["appointments"]
  doctors: { id: number; name: string; specialty: string; phone: string | null }[]
  patients: { id: number; name: string }[]
  attendance: { id: number; date: string; check_in: string | null; check_out: string | null; status: string; doctor_name: string }[]
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "doctors", label: "Kelola Dokter" },
  { id: "schedules", label: "Kelola Jadwal" },
  { id: "attendance", label: "Absensi Dokter" },
]

const ATTENDANCE_LABEL: Record<string, string> = { present: "Hadir", late: "Terlambat", absent: "Tidak Hadir" }
const ATTENDANCE_CLASS: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  late: "bg-yellow-100 text-yellow-800",
  absent: "bg-red-100 text-red-800",
}

export default function AdminDashboard() {
  const { data, loading, loadError, notice, act, logout } = useDashboard<AdminData>("/api/admin")
  const [activeTab, setActiveTab] = useState("overview")
  const [doctorOpen, setDoctorOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState({ name: "", specialty: "", phone: "" })
  const [newSchedule, setNewSchedule] = useState({ doctorId: "", patientId: "", date: "", time: "" })

  const addDoctor = async () => {
    const ok = await act(() => api("/api/admin/doctors", "POST", newDoctor), "Dokter berhasil ditambahkan.")
    if (ok) {
      setNewDoctor({ name: "", specialty: "", phone: "" })
      setDoctorOpen(false)
    }
  }

  const deactivateDoctor = (id: number, name: string) => {
    if (!confirm(`Nonaktifkan ${name}? Riwayat jadwal dan rekam medis tetap tersimpan.`)) return
    act(() => api(`/api/admin/doctors/${id}`, "DELETE"), "Dokter dinonaktifkan.")
  }

  const addSchedule = async () => {
    const ok = await act(
      () =>
        api("/api/admin/appointments", "POST", {
          doctorId: Number(newSchedule.doctorId),
          patientId: Number(newSchedule.patientId),
          date: newSchedule.date,
          time: newSchedule.time,
        }),
      "Jadwal berhasil dibuat.",
    )
    if (ok) {
      setNewSchedule({ doctorId: "", patientId: "", date: "", time: "" })
      setScheduleOpen(false)
    }
  }

  const cancelSchedule = (id: number) => {
    if (!confirm("Batalkan jadwal konsultasi ini?")) return
    act(() => api(`/api/admin/appointments/${id}`, "DELETE"), "Jadwal dibatalkan.")
  }

  const statusPill = (s: string) => <Pill className={STATUS_CLASS[s] ?? ""}>{STATUS_LABEL[s] ?? s}</Pill>

  return (
    <DashboardShell
      title="Admin"
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
                <StatCard title="Total Dokter" value={data.stats.total_doctors} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Jadwal Hari Ini" value={data.stats.today_appointments} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Total Pasien" value={data.stats.total_patients} icon={<UserPlus className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Konsultasi Selesai" value={data.stats.completed_appointments} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Konsultasi Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pasien</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recent.length === 0 && <Empty colSpan={5} />}
                      {data.recent.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.patient_name}</TableCell>
                          <TableCell>{a.doctor_name}</TableCell>
                          <TableCell>{fmtDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>{statusPill(a.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Kelola Dokter</h2>
                <Dialog open={doctorOpen} onOpenChange={setDoctorOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Dokter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Dokter Baru</DialogTitle>
                      <DialogDescription>Masukkan informasi dokter baru</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="doctorName">Nama Dokter</Label>
                        <Input id="doctorName" value={newDoctor.name} onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })} placeholder="Masukkan nama dokter" />
                      </div>
                      <div>
                        <Label htmlFor="specialty">Spesialisasi</Label>
                        <Input id="specialty" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} placeholder="Masukkan spesialisasi" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Nomor Telepon</Label>
                        <Input id="phone" value={newDoctor.phone} onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })} placeholder="Masukkan nomor telepon" />
                      </div>
                      <Button onClick={addDoctor} className="w-full">
                        Tambah Dokter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Daftar Dokter</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Spesialisasi</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.doctors.length === 0 && <Empty colSpan={4} />}
                      {data.doctors.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.name}</TableCell>
                          <TableCell>{d.specialty}</TableCell>
                          <TableCell>{d.phone ?? "-"}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => deactivateDoctor(d.id, d.name)} aria-label={`Nonaktifkan ${d.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "schedules" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Kelola Jadwal Konsultasi</h2>
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Jadwal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Jadwal Konsultasi</DialogTitle>
                      <DialogDescription>Buat jadwal konsultasi baru</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Pilih Dokter</Label>
                        <Select value={newSchedule.doctorId} onValueChange={(v) => setNewSchedule({ ...newSchedule, doctorId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih dokter" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.doctors.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name} - {d.specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Pilih Pasien</Label>
                        <Select value={newSchedule.patientId} onValueChange={(v) => setNewSchedule({ ...newSchedule, patientId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pasien" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.patients.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Tanggal</Label>
                        <Input id="date" type="date" value={newSchedule.date} onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="time">Waktu</Label>
                        <Input id="time" type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })} />
                      </div>
                      <Button onClick={addSchedule} className="w-full">
                        Tambah Jadwal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Daftar Jadwal Konsultasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dokter</TableHead>
                        <TableHead>Pasien</TableHead>
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
                          <TableCell>{a.doctor_name}</TableCell>
                          <TableCell>{a.patient_name}</TableCell>
                          <TableCell>{fmtDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>{statusPill(a.status)}</TableCell>
                          <TableCell>
                            {(a.status === "scheduled" || a.status === "confirmed") && (
                              <Button variant="outline" size="sm" onClick={() => cancelSchedule(a.id)} aria-label="Batalkan jadwal">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Absensi Dokter</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Absensi (60 terakhir)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead>Masuk</TableHead>
                        <TableHead>Pulang</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.attendance.length === 0 && <Empty colSpan={5} text="Belum ada absensi." />}
                      {data.attendance.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{fmtDate(r.date)}</TableCell>
                          <TableCell>{r.doctor_name}</TableCell>
                          <TableCell>{r.check_in ?? "-"}</TableCell>
                          <TableCell>{r.check_out ?? "-"}</TableCell>
                          <TableCell>
                            <Pill className={ATTENDANCE_CLASS[r.status] ?? ""}>{ATTENDANCE_LABEL[r.status] ?? r.status}</Pill>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}

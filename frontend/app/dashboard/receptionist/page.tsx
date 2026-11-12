"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Clock, CreditCard, Users, CheckCircle, XCircle, UserPlus } from "lucide-react"
import { DashboardShell, Empty, Pill, StatCard } from "@/components/dashboard/shell"
import { useDashboard } from "@/lib/use-dashboard"
import { api } from "@/lib/client"
import { fmtDate, METHOD_LABEL, PAYMENT_CLASS, PAYMENT_LABEL, rupiah, STATUS_CLASS, STATUS_LABEL } from "@/lib/labels"

type RecData = {
  stats: { waiting: number; pending_payments: number; total_patients: number; today_appointments: number }
  appointments: { id: number; date: string; time: string; status: string; patient_name: string; doctor_name: string }[]
  payments: { id: number; amount: number; method: string; status: string; proof: string | null; patient_name: string }[]
  patients: { id: number; name: string; phone: string | null; email: string | null; address: string | null }[]
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Konfirmasi Jadwal" },
  { id: "payments", label: "Verifikasi Pembayaran" },
  { id: "patients", label: "Data Pasien" },
]

const EMPTY_PATIENT = { name: "", phone: "", email: "", address: "" }

export default function ReceptionistDashboard() {
  const { data, loading, loadError, notice, act, logout } = useDashboard<RecData>("/api/receptionist")
  const [activeTab, setActiveTab] = useState("overview")
  const [open, setOpen] = useState(false)
  const [newPatient, setNewPatient] = useState(EMPTY_PATIENT)

  const confirmAppointment = (id: number) => act(() => api(`/api/receptionist/appointments/${id}`, "PATCH"), "Jadwal dikonfirmasi.")

  const decidePayment = (id: number, action: "verify" | "reject") =>
    act(() => api(`/api/receptionist/payments/${id}`, "PATCH", { action }), action === "verify" ? "Pembayaran diverifikasi." : "Pembayaran ditolak.")

  const addPatient = async () => {
    const ok = await act(() => api("/api/receptionist/patients", "POST", newPatient), "Pasien berhasil ditambahkan.")
    if (ok) {
      setNewPatient(EMPTY_PATIENT)
      setOpen(false)
    }
  }

  return (
    <DashboardShell
      title="Resepsionis"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Jadwal Menunggu" value={data.stats.waiting} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
              <StatCard title="Pembayaran Pending" value={data.stats.pending_payments} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} />
              <StatCard title="Total Pasien" value={data.stats.total_patients} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
              <StatCard title="Jadwal Hari Ini" value={data.stats.today_appointments} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Konfirmasi Jadwal Konsultasi</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Aktif</CardTitle>
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
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.appointments.length === 0 && <Empty colSpan={6} text="Tidak ada jadwal yang menunggu." />}
                      {data.appointments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.patient_name}</TableCell>
                          <TableCell>{a.doctor_name}</TableCell>
                          <TableCell>{fmtDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>
                            <Pill className={STATUS_CLASS[a.status] ?? ""}>{STATUS_LABEL[a.status] ?? a.status}</Pill>
                          </TableCell>
                          <TableCell>
                            {a.status === "scheduled" && (
                              <Button size="sm" onClick={() => confirmAppointment(a.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Konfirmasi
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

          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Verifikasi Pembayaran</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pasien</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Metode</TableHead>
                        <TableHead>Bukti</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payments.length === 0 && <Empty colSpan={6} text="Belum ada pembayaran." />}
                      {data.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.patient_name}</TableCell>
                          <TableCell>{rupiah(p.amount)}</TableCell>
                          <TableCell>{METHOD_LABEL[p.method] ?? p.method}</TableCell>
                          <TableCell>{p.proof ?? "-"}</TableCell>
                          <TableCell>
                            <Pill className={PAYMENT_CLASS[p.status] ?? ""}>{PAYMENT_LABEL[p.status] ?? p.status}</Pill>
                          </TableCell>
                          <TableCell>
                            {p.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => decidePayment(p.id, "verify")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verifikasi
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => decidePayment(p.id, "reject")}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Tolak
                                </Button>
                              </div>
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

          {activeTab === "patients" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Data Pasien</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambah Pasien
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Pasien Baru</DialogTitle>
                      <DialogDescription>Daftarkan pasien yang datang langsung ke klinik</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pname">Nama Lengkap</Label>
                        <Input id="pname" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="pphone">Nomor Telepon</Label>
                        <Input id="pphone" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="pemail">Email (opsional)</Label>
                        <Input id="pemail" type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="paddress">Alamat</Label>
                        <Textarea id="paddress" rows={3} value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} />
                      </div>
                      <Button onClick={addPatient} className="w-full" disabled={!newPatient.name || !newPatient.phone}>
                        Tambah Pasien
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pasien Terdaftar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Alamat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.patients.length === 0 && <Empty colSpan={4} />}
                      {data.patients.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.phone ?? "-"}</TableCell>
                          <TableCell>{p.email ?? "-"}</TableCell>
                          <TableCell>{p.address ?? "-"}</TableCell>
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

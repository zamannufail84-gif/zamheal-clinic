"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, CheckCircle, FileText, Plus, CreditCard } from "lucide-react"
import { DashboardShell, Empty, Pill, StatCard } from "@/components/dashboard/shell"
import { useDashboard } from "@/lib/use-dashboard"
import { api } from "@/lib/client"
import { fmtDate, METHOD_LABEL, PAYMENT_CLASS, PAYMENT_LABEL, rupiah, STATUS_CLASS, STATUS_LABEL } from "@/lib/labels"

type Appt = { id: number; date: string; time: string; status: string; doctor_name: string; specialty: string; payment_status: string }
type PatientData = {
  patient: { id: number; name: string }
  appointments: Appt[]
  records: { id: number; date: string; diagnosis: string | null; treatment: string | null; prescription: string | null; notes: string | null; doctor_name: string }[]
  doctors: { id: number; name: string; specialty: string }[]
  fee: number
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Jadwal Konsultasi" },
  { id: "records", label: "Rekam Medis" },
  { id: "payment", label: "Pembayaran" },
]

export default function PatientDashboard() {
  const { data, loading, loadError, notice, act, logout } = useDashboard<PatientData>("/api/patient")
  const [activeTab, setActiveTab] = useState("overview")
  const [bookOpen, setBookOpen] = useState(false)
  const [booking, setBooking] = useState({ doctorId: "", date: "", time: "" })
  const [paying, setPaying] = useState<Appt | null>(null)
  const [pay, setPay] = useState({ method: "", proof: "" })

  const book = async () => {
    const ok = await act(
      () => api("/api/patient/appointments", "POST", { ...booking, doctorId: Number(booking.doctorId) }),
      "Jadwal konsultasi berhasil dibuat.",
    )
    if (ok) {
      setBooking({ doctorId: "", date: "", time: "" })
      setBookOpen(false)
    }
  }

  const submitPayment = async () => {
    if (!paying) return
    const ok = await act(
      () => api("/api/patient/payments", "POST", { appointmentId: paying.id, ...pay }),
      "Pembayaran diajukan. Menunggu verifikasi resepsionis.",
    )
    if (ok) {
      setPaying(null)
      setPay({ method: "", proof: "" })
    }
  }

  const todayStr = new Date().toLocaleDateString("sv-SE")
  const upcoming = data?.appointments.filter((a) => (a.status === "scheduled" || a.status === "confirmed") && a.date >= todayStr).length ?? 0
  const done = data?.appointments.filter((a) => a.status === "completed").length ?? 0
  const canPay = (a: Appt) => a.status !== "cancelled" && (a.payment_status === "none" || a.payment_status === "failed")

  return (
    <DashboardShell
      title={data ? `Pasien (${data.patient.name})` : "Pasien"}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Jadwal Mendatang" value={upcoming} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
              <StatCard title="Konsultasi Selesai" value={done} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} />
              <StatCard title="Rekam Medis" value={data.records.length} icon={<FileText className="h-4 w-4 text-muted-foreground" />} />
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Jadwal Konsultasi</h2>
                <Dialog open={bookOpen} onOpenChange={setBookOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Jadwal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat Jadwal Konsultasi</DialogTitle>
                      <DialogDescription>Pilih dokter dan waktu konsultasi</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Pilih Dokter</Label>
                        <Select value={booking.doctorId} onValueChange={(v) => setBooking({ ...booking, doctorId: v })}>
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
                        <Label htmlFor="date">Tanggal</Label>
                        <Input id="date" type="date" min={todayStr} value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="time">Waktu</Label>
                        <Input id="time" type="time" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} />
                      </div>
                      <Button onClick={book} className="w-full" disabled={!booking.doctorId || !booking.date || !booking.time}>
                        Buat Jadwal
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
                        <TableHead>Spesialisasi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pembayaran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.appointments.length === 0 && <Empty colSpan={6} text="Belum ada jadwal. Klik “Buat Jadwal” untuk memulai." />}
                      {data.appointments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.doctor_name}</TableCell>
                          <TableCell>{a.specialty}</TableCell>
                          <TableCell>{fmtDate(a.date)}</TableCell>
                          <TableCell>{a.time}</TableCell>
                          <TableCell>
                            <Pill className={STATUS_CLASS[a.status] ?? ""}>{STATUS_LABEL[a.status] ?? a.status}</Pill>
                          </TableCell>
                          <TableCell>
                            <Pill className={PAYMENT_CLASS[a.payment_status] ?? ""}>{PAYMENT_LABEL[a.payment_status] ?? a.payment_status}</Pill>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "records" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Rekam Medis</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Konsultasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Pengobatan</TableHead>
                        <TableHead>Resep</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.records.length === 0 && <Empty colSpan={6} text="Belum ada rekam medis." />}
                      {data.records.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{fmtDate(r.date)}</TableCell>
                          <TableCell>{r.doctor_name}</TableCell>
                          <TableCell>{r.diagnosis ?? "-"}</TableCell>
                          <TableCell>{r.treatment ?? "-"}</TableCell>
                          <TableCell>{r.prescription ?? "-"}</TableCell>
                          <TableCell>{r.notes ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Pembayaran</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Tagihan Konsultasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dokter</TableHead>
                        <TableHead>Biaya</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.appointments.filter((a) => a.status !== "cancelled").length === 0 && <Empty colSpan={5} text="Belum ada tagihan." />}
                      {data.appointments
                        .filter((a) => a.status !== "cancelled")
                        .map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>{fmtDate(a.date)}</TableCell>
                            <TableCell>{a.doctor_name}</TableCell>
                            <TableCell>{rupiah(data.fee)}</TableCell>
                            <TableCell>
                              <Pill className={PAYMENT_CLASS[a.payment_status] ?? ""}>{PAYMENT_LABEL[a.payment_status] ?? a.payment_status}</Pill>
                            </TableCell>
                            <TableCell>
                              {canPay(a) && (
                                <Button size="sm" onClick={() => setPaying(a)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Bayar
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

          <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pembayaran Konsultasi</DialogTitle>
                <DialogDescription>
                  {paying?.doctor_name} · {fmtDate(paying?.date)} · {rupiah(data.fee)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Metode Pembayaran</Label>
                  <Select value={pay.method} onValueChange={(v) => setPay({ ...pay, method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METHOD_LABEL).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {pay.method && pay.method !== "cash" && (
                  <div>
                    <Label htmlFor="proof">Nomor referensi / bukti pembayaran</Label>
                    <Input id="proof" value={pay.proof} onChange={(e) => setPay({ ...pay, proof: e.target.value })} placeholder="Contoh: TRX-123456" />
                  </div>
                )}
                <p className="text-xs text-gray-500">Pembayaran akan berstatus “Menunggu Verifikasi” sampai dicek resepsionis.</p>
                <Button onClick={submitPayment} className="w-full" disabled={!pay.method}>
                  Ajukan Pembayaran
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardShell>
  )
}

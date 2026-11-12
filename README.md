# Zamheal Clinic

Sistem manajemen klinik: **Next.js (frontend)** + **PHP (backend API)** + **MySQL/MariaDB**.

```
Browser ──► Next.js :3000 ──(/api/* diteruskan)──► PHP API (Apache/XAMPP) ──► MySQL
```

Browser hanya berbicara ke Next.js. Semua permintaan `/api/*` diteruskan oleh Next.js ke backend PHP
(lewat `rewrites` di `frontend/next.config.mjs`), sehingga cookie sesi tetap satu alamat dan tidak butuh CORS.

## Struktur

```
zamheal-clinic/
├── frontend/                 # Next.js (UI: landing, login, daftar, 4 dashboard)
│   ├── app/                  #   halaman
│   ├── components/           #   komponen UI + kerangka dashboard
│   ├── lib/                  #   client API, hook dashboard, label/format
│   └── .env.example          #   BACKEND_URL
└── backend/                  # PHP API
    ├── api/index.php         #   front controller + router (satu-satunya pintu masuk web)
    ├── src/bootstrap.php     #   konfigurasi, PDO, sesi, helper
    ├── src/routes/           #   auth, admin, doctor, patient, receptionist
    ├── database/zamheal_clinic.sql   # skema + data contoh
    └── .env.example          #   pengaturan database
```

## Menjalankan (Windows + XAMPP)

### 1. Backend + database
1. Buka XAMPP Control Panel, **Start** Apache dan MySQL.
2. Salin **isi** folder `backend` ke `C:\xampp\htdocs\zamheal-clinic` (jadi ada `htdocs\zamheal-clinic\api\index.php`).
3. Buka `http://localhost/phpmyadmin` → tab **Import** → pilih `backend/database/zamheal_clinic.sql` → **Import**.
   File ini membuat database `zamheal_clinic` otomatis.
   > ⚠️ File ini **menghapus dan membuat ulang** semua tabel Zamheal. Jangan diimpor ulang bila sudah ada data asli.
4. (Opsional) bila MySQL Anda berpassword: salin `.env.example` menjadi `.env` di `htdocs\zamheal-clinic` dan isi `DB_PASSWORD`.
5. Cek: buka `http://localhost/zamheal-clinic/api/index.php/auth/me` → harus tampil `{"error":"Belum login."}`.

### 2. Frontend
Prasyarat: Node.js 20+ dan pnpm (atau npm).
```bash
cd frontend
cp .env.example .env.local      # Windows: copy .env.example .env.local
pnpm install                    # atau: npm install
pnpm dev                        # atau: npm run dev
```
Buka **http://localhost:3000**.

Bila backend tidak di `http://localhost/zamheal-clinic/api/index.php`, ubah `BACKEND_URL` di `.env.local`.
Untuk produksi, `BACKEND_URL` harus sudah terisi **sebelum** `pnpm build` (nilainya ikut tertanam saat build).

## Akun contoh (password semua: `password123`)

| Peran | Username |
|---|---|
| Admin | `admin` |
| Resepsionis | `resepsionis` |
| Dokter | `dokter1` … `dokter4` |
| Pasien | `pasien1` |

Pasien baru bisa mendaftar lewat halaman **Daftar**. **Ganti semua password contoh sebelum dipakai sungguhan.**

## Fitur per peran

- **Admin**: statistik + jadwal terbaru, kelola dokter (tambah/nonaktifkan), kelola jadwal (buat/batalkan), riwayat absensi dokter.
- **Dokter**: jadwal & status konsultasi, isi diagnosis/pengobatan/resep (otomatis jadi rekam medis), data pasien, absen masuk/pulang.
- **Pasien**: buat jadwal, lihat rekam medis, ajukan pembayaran.
- **Resepsionis**: konfirmasi jadwal, verifikasi/tolak pembayaran, tambah pasien walk-in.

## Endpoint API (`/api/index.php/<rute>`; lewat Next cukup `/api/<rute>`)

| Metode & rute | Peran |
|---|---|
| `POST auth/login`, `POST auth/register`, `POST auth/logout`, `GET auth/me` | publik / login |
| `GET admin`, `POST admin/doctors`, `DELETE admin/doctors/{id}`, `POST admin/appointments`, `DELETE admin/appointments/{id}` | admin |
| `GET doctor`, `PATCH doctor/appointments/{id}`, `POST doctor/attendance` | dokter |
| `GET patient`, `POST patient/appointments`, `POST patient/payments` | pasien |
| `GET receptionist`, `PATCH receptionist/appointments/{id}`, `PATCH receptionist/payments/{id}`, `POST receptionist/patients` | resepsionis |

Keamanan yang diterapkan: query berparameter (PDO), `password_verify`, sesi cookie `HttpOnly` + `SameSite=Lax`,
`session_regenerate_id` saat login, pembatasan 5 percobaan login/15 menit, pengecekan peran di setiap endpoint,
permintaan tulis wajib `application/json`, dan `.htaccess` yang menutup `src/`, `.env`, dan file lain dari akses web.

## Catatan & batasan

- Dokter yang ditambah admin belum punya akun login (hanya data dokter). Akun dokter saat ini dibuat lewat SQL.
- Bukti pembayaran berupa nomor/teks referensi, belum unggah file.
- Dokter dan jadwal yang "dihapus" sebenarnya dinonaktifkan/dibatalkan agar riwayat dan rekam medis tidak hilang.
- Pembatas login memakai file sementara server; untuk banyak server gunakan penyimpanan bersama (mis. Redis/DB).
- Saat produksi, pasang HTTPS (cookie otomatis `Secure` bila HTTPS terdeteksi).

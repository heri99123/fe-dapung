# Dapung App

Sistem manajemen warga, transaksi dana, dan absensi ronda berbasis web untuk pengelolaan RT/RW.

---

## Daftar Isi

- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Direktori](#struktur-direktori)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [Halaman & Rute](#halaman--rute)
- [API Backend](#api-backend)
- [Fitur Utama](#fitur-utama)
- [Deploy dengan Docker](#deploy-dengan-docker)

---

## Arsitektur Sistem

```
┌─────────────────────┐        HTTP/JSON        ┌──────────────────────┐
│   Frontend          │ ───────────────────────► │   Backend            │
│   Next.js 15        │ ◄─────────────────────── │   Express.js 4       │
│   (App Router)      │     Bearer JWT Token     │   Node.js (ESM)      │
└─────────────────────┘                          └──────────┬───────────┘
                                                            │ mysql2
                                                 ┌──────────▼───────────┐
                                                 │   MySQL Database     │
                                                 └──────────────────────┘
```

- Frontend: Next.js standalone output, dapat di-deploy sebagai container mandiri.
- Backend: Express.js REST API, JWT untuk autentikasi.
- Database: MySQL, skema diinisialisasi via `backend/init.sql`.

---

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 15.5.9 | Framework (App Router) |
| TypeScript | 5 | Bahasa |
| Tailwind CSS | v4 | Styling |
| shadcn/ui + Radix UI | — | Komponen UI |
| react-hook-form + zod | — | Form & validasi |
| recharts | — | Chart/grafik |
| html5-qrcode | — | Scanner QR/barcode |
| jsPDF + xlsx | — | Export PDF & Excel |
| date-fns, dayjs | — | Utilitas tanggal |
| sonner | — | Toast notifikasi |
| next-themes | — | Tema (terkunci light) |

### Backend

| Teknologi | Versi | Fungsi |
|---|---|---|
| Express.js | 4 | Framework REST API |
| mysql2 | — | Koneksi MySQL |
| jsonwebtoken | — | Autentikasi JWT |
| bcryptjs | — | Hash password |
| pino + pino-http | — | Logging |
| nodemon | — | Hot reload dev |

---

## Struktur Direktori

```
fe-dapung/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point
│   │   ├── config/                # Konfigurasi DB & logger
│   │   ├── controllers/           # Handler tiap resource
│   │   ├── middleware/            # JWT auth, error handler
│   │   ├── routes/                # Express router
│   │   └── sql/                   # Query SQL
│   ├── init.sql                   # Inisialisasi skema DB
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── .env.example
└── frontend/
    ├── app/                       # Halaman (Next.js App Router)
    ├── components/
    │   ├── auth/                  # Login form, idle logout
    │   ├── layout/                # Sidebar, header, dashboard layout
    │   ├── attendance/            # Manajemen & tracker absensi
    │   ├── barcode/               # Generator & scanner barcode
    │   ├── dashboard/             # Dashboard per peran
    │   ├── forms/                 # Form CRUD warga, rumah, petugas
    │   ├── transactions/          # Form & list transaksi
    │   ├── ronda/                 # Info kelompok ronda
    │   └── ui/                    # Komponen UI (shadcn/ui)
    ├── hooks/                     # use-mobile, use-toast
    ├── lib/
    │   ├── api.ts                 # ApiClient (fetch wrapper + JWT)
    │   ├── auth.ts                # Login, logout, verifikasi token, RBAC
    │   ├── database.ts            # Fungsi domain ke REST API
    │   ├── transactions.ts        # Operasi transaksi
    │   ├── attendance.ts          # Operasi presensi
    │   ├── barcode.ts             # Generate & scan barcode
    │   └── export-utils.ts        # Export PDF, Excel, CSV
    ├── types/                     # TypeScript type definitions
    ├── public/                    # Aset statis (logo)
    ├── next.config.mjs
    ├── Dockerfile
    ├── docker-compose.yml
    └── .env.example
```

---

## Instalasi & Menjalankan

### Prasyarat

- Node.js >= 20
- MySQL >= 8
- (Opsional) Docker & Docker Compose

### Tanpa Docker

**Backend**

```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi DB
npm install
npm run dev       # development
npm start         # production
```

**Frontend**

```bash
cd frontend
cp .env.example .env
# Edit NEXT_PUBLIC_API_URL sesuai URL backend
npm install
npm run dev       # development (default port 3000)
npm run build && npm start  # production
```

### Dengan Docker

```bash
# Backend
cd backend
docker compose up -d

# Frontend
cd frontend
docker compose up -d
```

---

## Variabel Lingkungan

### Frontend (`frontend/.env`)

| Variabel | Contoh | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server Next.js |
| `HOST_PORT` | `3000` | Port host Docker |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Base URL API backend |
| `NEXT_PUBLIC_AWAL_WAKTU_PERTAMA` | `06:00` | Awal shift pertama |
| `NEXT_PUBLIC_AKHIR_WAKTU_PERTAMA` | `12:00` | Akhir shift pertama |
| `NEXT_PUBLIC_AWAL_WAKTU_KEDUA` | `13:00` | Awal shift kedua |
| `NEXT_PUBLIC_AKHIR_WAKTU_KEDUA` | `18:00` | Akhir shift kedua |

### Backend (`backend/.env`)

| Variabel | Contoh | Keterangan |
|---|---|---|
| `PORT` | `5000` | Port server Express |
| `NODE_ENV` | `production` | Environment |
| `FRONTEND_URL` | `http://localhost:3000` | URL frontend (CORS) |
| `CORS_ORIGIN` | `http://localhost:3000` | Origin CORS yang diizinkan |
| `JWT_SECRET` | `your-secret-key` | Secret JWT (rahasia!) |
| `DB_HOST` | `localhost` | Host MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_DATABASE` | `dapung` | Nama database |
| `DB_USERNAME` | `root` | Username MySQL |
| `DB_PASSWORD` | `password` | Password MySQL |

---

## Autentikasi & Otorisasi

### Alur Login

1. User POST ke `/api/auth/login` dengan `{ identifier, password, loginType }`.
   - `loginType`: `"phone"` atau `"username"`
2. Backend validasi, kembalikan JWT token.
3. Frontend simpan token di `localStorage.authToken` dan data user di `localStorage.currentUser`.
4. Setiap request API menyertakan header `Authorization: Bearer <token>`.

### Peran (Role)

| Peran | Akses |
|---|---|
| `warga` | Dashboard warga, data transaksi milik sendiri |
| `petugas` | Scan barcode, input transaksi, absensi |
| `admin` | Semua data (warga, rumah, petugas, transaksi, laporan) |
| `super_admin` | Sama dengan admin + manajemen jenis dana |

### Keamanan Sesi

- **Idle logout**: Sesi otomatis berakhir setelah **10 menit** tidak ada aktivitas.
- **Route guard**: `DashboardLayout` cek `localStorage.currentUser`; jika tidak ada, redirect ke `/`.
- **RBAC**: `canAccessRoute()` di `lib/auth.ts` periksa role terhadap rute yang diakses.

---

## Halaman & Rute

| Rute | Deskripsi | Peran |
|---|---|---|
| `/` | Halaman login | Semua |
| `/dashboard` | Dashboard utama (redirect sesuai peran) | Semua |
| `/data-rumah` | Manajemen data rumah | admin, super_admin |
| `/data-warga` | Manajemen data warga | admin, super_admin |
| `/data-petugas` | Manajemen data petugas | admin, super_admin |
| `/data-transaksi` | Riwayat transaksi warga | warga |
| `/jenis-dana` | Manajemen jenis dana | admin, super_admin |
| `/kelompok-ronda` | Manajemen kelompok ronda | admin, super_admin |
| `/transaksi-dana` | Daftar transaksi dana | admin, super_admin, petugas |
| `/transaksi-dana/input-manual` | Input transaksi manual | petugas |
| `/scan-barcode` | Scanner QR/barcode warga | petugas |
| `/absensi` | Manajemen absensi ronda | petugas, admin, super_admin |
| `/laporan` | Laporan & ekspor data | admin, super_admin |
| `/notifications` | Notifikasi sistem | Semua |
| `/settings` | Pengaturan akun | Semua |

---

## API Backend

Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000/api`)

Semua endpoint (kecuali `/auth`) membutuhkan header:
```
Authorization: Bearer <jwt_token>
```

### Endpoint Utama

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/auth/login` | Login, kembalikan JWT |
| POST | `/auth/verify-token` | Verifikasi JWT |
| POST | `/auth/logout` | Logout |
| GET/POST | `/rumah` | List / tambah data rumah |
| GET/PUT/DELETE | `/rumah/:id` | Detail / ubah / hapus rumah |
| GET/POST | `/warga` | List / tambah data warga |
| GET/PUT/DELETE | `/warga/:id` | Detail / ubah / hapus warga |
| GET | `/warga/barcode/:barcode` | Cari warga by barcode |
| GET | `/warga/kepala-keluarga` | Daftar kepala keluarga |
| GET/POST | `/petugas` | List / tambah petugas |
| GET/PUT/DELETE | `/petugas/:id` | Detail / ubah / hapus petugas |
| GET | `/petugas/:id/check-schedule` | Cek jadwal petugas |
| GET/POST | `/jenis-dana` | List / tambah jenis dana |
| PUT/DELETE | `/jenis-dana/:id` | Ubah / hapus jenis dana |
| GET/POST | `/kelompok-ronda` | List / tambah kelompok ronda |
| GET | `/kelompok-ronda/:id/anggota` | Anggota kelompok ronda |
| GET/POST | `/transaksi` | List / tambah transaksi |
| GET | `/transaksi/:id` | Detail transaksi |
| GET | `/transaksi/warga/:id` | Transaksi milik warga |
| GET/POST | `/presensi` | List / tambah presensi |
| PUT | `/presensi/:id` | Update presensi |
| GET | `/laporan` | Data laporan |
| GET | `/dashboard` | Statistik dashboard |

---

## Fitur Utama

### Manajemen Warga & Rumah
CRUD data warga dan rumah. Setiap warga memiliki barcode unik dengan format `RMH{id}{timestamp}`.

### Scan Barcode
Petugas scan QR code warga menggunakan kamera (via `html5-qrcode`) untuk identifikasi cepat sebelum input transaksi.

### Transaksi Dana
Input, riwayat, dan laporan transaksi dana warga. Mendukung input manual dan via scan barcode.

### Absensi Ronda
Petugas check-in/check-out shift. Admin dapat melihat riwayat dan rekap absensi seluruh petugas.

### Laporan & Ekspor
Ekspor data transaksi dan laporan ke format **PDF**, **Excel (.xlsx)**, atau **CSV**.

### Dashboard Per Peran
- **Warga**: Riwayat transaksi dan tagihan pribadi.
- **Petugas**: Statistik absensi dan jadwal shift.
- **Admin/Super Admin**: Ringkasan warga, transaksi, dan petugas aktif; auto-refresh setiap 30 detik.

---

## Deploy dengan Docker

### Frontend

```bash
cd frontend
# Build image
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://your-backend-url/api \
  --build-arg PORT=3000 \
  -t dapung-frontend .

# Atau gunakan docker compose
docker compose up -d
```

### Backend

```bash
cd backend
# Development
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

> **Catatan**: Inisialisasi database dilakukan otomatis via `init.sql` saat container MySQL pertama kali dijalankan.

---

## Lisensi

Proyek ini dikembangkan untuk keperluan internal pengelolaan RT/RW.

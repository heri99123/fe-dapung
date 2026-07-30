# SQL Scripts - Sistem Jimpitan Ronda

## 📁 Struktur File

### 1. create-tables.sql
File utama untuk membuat struktur database lengkap dengan semua tabel.

**Cara menggunakan:**
```sql
SOURCE create-tables.sql;
```

### 2. File Seed Data

Seed data untuk mengisi tabel dengan data contoh/default:

- `seed-jenis-dana.sql` - Data jenis dana (Jimpitan Harian, Kas Ronda, Dana Sosial)
- `seed-kelompok-ronda.sql` - Kelompok ronda berdasarkan hari (Senin s/d Minggu)
- `seed-rumah.sql` - Data rumah contoh
- `seed-warga.sql` - Data warga contoh  
- `seed-petugas.sql` - Data petugas/user sistem
- `seed-presensi.sql` - Data presensi contoh
- `seed-transaksi.sql` - Data transaksi contoh
- `seed-laporan.sql` - Data laporan contoh

## 🚀 Cara Setup Database

### Setup Lengkap (Fresh Install)

1. **Buat & Setup Database:**
```sql
SOURCE create-tables.sql;
```

2. **Insert Data Master (Wajib):**
```sql
SOURCE seed-jenis-dana.sql;
SOURCE seed-kelompok-ronda.sql;
```

3. **Insert Data Sample (Opsional):**
```sql
SOURCE seed-rumah.sql;
SOURCE seed-warga.sql;
SOURCE seed-petugas.sql;
SOURCE seed-presensi.sql;
SOURCE seed-transaksi.sql;
SOURCE seed-laporan.sql;
```

### Setup Minimal (Hanya Master Data)

Jika hanya ingin data master tanpa data sample:

```sql
SOURCE create-tables.sql;
SOURCE seed-jenis-dana.sql;
SOURCE seed-kelompok-ronda.sql;
```

## 📝 Urutan Seed Data (Penting!)

Karena ada foreign key constraint, pastikan urutan seed seperti ini:

1. `jenis_dana` - Tidak ada dependency
2. `kelompok_ronda` - Tidak ada dependency
3. `rumah` - Tidak ada dependency
4. `warga` - Depends on: rumah
5. `petugas` - Depends on: warga, kelompok_ronda
6. `presensi` - Depends on: warga, kelompok_ronda, petugas
7. `transaksi` - Depends on: warga, rumah, jenis_dana
8. `laporan` - Depends on: rumah, jenis_dana, kelompok_ronda

## 🔐 Default User Credentials

Setelah seed petugas:

**SuperAdmin:**
- Username: `superadmin`
- Password: `admin123`

**Admin:**
- Username: `admin`
- Password: `admin123`

**Petugas Contoh:**
- Username: `petugas1`
- Password: `petugas123`

## ⚠️ Catatan Penting

1. **Backup Database** sebelum running script
2. Pastikan urutan seed sesuai dependency
3. Password disimpan dalam MD5 hash
4. Data sample bisa disesuaikan dengan kebutuhan
5. File `create-tables.sql` akan DROP DATABASE jika sudah ada

## 🔄 Reset Database

Untuk reset database ke kondisi awal:

```sql
DROP DATABASE fundraising_dbcopyyy;
SOURCE create-tables.sql;
-- Lalu jalankan seed yang diperlukan
```

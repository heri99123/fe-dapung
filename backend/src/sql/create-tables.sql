-- =========================================================
-- DATABASE: fundraising_dbcopyyy
-- =========================================================
CREATE DATABASE IF NOT EXISTS fundraising_dbcopyyy;
USE fundraising_dbcopyyy;

-- =========================================================
-- TABLE: rumah
-- =========================================================
CREATE TABLE rumah (
    id_rumah INT AUTO_INCREMENT PRIMARY KEY,
    alamat VARCHAR(255) NOT NULL,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kode_barcode VARCHAR(100),
    status_kepemilikan ENUM('Milik Sendiri', 'Sewa', 'Kontrak') DEFAULT 'Milik Sendiri',
    id_kepala_keluarga INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: warga
-- =========================================================
CREATE TABLE warga (
    id_warga INT AUTO_INCREMENT PRIMARY KEY,
    id_rumah INT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    nik VARCHAR(20) UNIQUE,
    nomor_hp VARCHAR(15),
    jenis_kelamin ENUM('Laki-laki','Perempuan') NOT NULL,
    status_aktif ENUM('Aktif','Tidak Aktif') DEFAULT 'Aktif',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password_custom VARCHAR(255) DEFAULT NULL COMMENT 'Password untuk login warga, MD5 hash',
    email VARCHAR(100) DEFAULT NULL,
    alamat TEXT DEFAULT NULL,
    FOREIGN KEY (id_rumah) REFERENCES rumah(id_rumah) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================================
-- TABLE: kelompok_ronda
-- =========================================================
CREATE TABLE kelompok_ronda (
    id_kelompok_ronda INT AUTO_INCREMENT PRIMARY KEY,
    nama_kelompok VARCHAR(100) NOT NULL,
    jadwal_hari VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: petugas
-- =========================================================
CREATE TABLE petugas (
    id_petugas INT AUTO_INCREMENT PRIMARY KEY,
    id_warga INT,
    id_kelompok_ronda INT,
    jabatan VARCHAR(50),
    role ENUM('SuperAdmin','Admin','Petugas','Warga') DEFAULT 'Petugas',
    status ENUM('Aktif','Tidak Aktif') DEFAULT 'Aktif',
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_warga) REFERENCES warga(id_warga) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_kelompok_ronda) REFERENCES kelompok_ronda(id_kelompok_ronda) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================================
-- TABLE: presensi
-- =========================================================
CREATE TABLE presensi (
    id_presensi INT AUTO_INCREMENT PRIMARY KEY,
    id_warga INT,
    id_kelompok_ronda INT,
    tanggal DATE,
    check_in DATETIME,
    check_out DATETIME,
    keterangan TEXT,
    status ENUM('Hadir','Tidak Hadir','Izin','Sakit','Alpha') DEFAULT 'Hadir',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    id_petugas INT,
    FOREIGN KEY (id_warga) REFERENCES warga(id_warga) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_kelompok_ronda) REFERENCES kelompok_ronda(id_kelompok_ronda) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_petugas) REFERENCES petugas(id_petugas) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================================
-- TABLE: jenis_dana
-- =========================================================
CREATE TABLE jenis_dana (
    id_jenis_dana INT AUTO_INCREMENT PRIMARY KEY,
    nama_dana VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    nominal_default DECIMAL(12,2) DEFAULT 0.00,
    periode_bayar ENUM('harian','mingguan','bulanan','tahunan') DEFAULT 'harian',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLE: transaksi
-- =========================================================
CREATE TABLE transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    id_warga INT,
    id_user INT,
    tanggal_setor DATE,
    waktu_input DATETIME DEFAULT CURRENT_TIMESTAMP,
    nominal DECIMAL(12,2),
    status_jimpitan ENUM('lunas','belum_lunas') DEFAULT 'lunas',
    id_rumah INT,
    id_jenis_dana INT,
    jumlah_bayar DECIMAL(12,2) NOT NULL,
    tanggal_bayar DATE,
    jenis_transaksi ENUM('Masuk','Keluar') DEFAULT 'Masuk',
    status ENUM('Berhasil','Pending','Gagal') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rumah) REFERENCES rumah(id_rumah) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_jenis_dana) REFERENCES jenis_dana(id_jenis_dana) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_warga) REFERENCES warga(id_warga) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================================
-- TABLE: laporan
-- =========================================================
CREATE TABLE laporan (
    id_laporan INT AUTO_INCREMENT PRIMARY KEY,
    id_rumah INT,
    id_jenis_dana INT,
    id_kelompok_ronda INT,
    bulan VARCHAR(20),
    tahun INT,
    total_jimpitan DECIMAL(12,2),
    total_transaksi DECIMAL(12,2),
    status_bayar ENUM('Sudah Bayar','Belum Bayar') DEFAULT 'Belum Bayar',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rumah) REFERENCES rumah(id_rumah) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_jenis_dana) REFERENCES jenis_dana(id_jenis_dana) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_kelompok_ronda) REFERENCES kelompok_ronda(id_kelompok_ronda) ON DELETE SET NULL ON UPDATE CASCADE
);
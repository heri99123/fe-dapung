-- =========================================================
-- MASTER SEED FILE - RUN ALL SEEDS IN CORRECT ORDER
-- Database: fundraising_dbcopyyy
-- =========================================================

USE fundraising_dbcopyyy;

-- =========================================================
-- STEP 1: SEED MASTER DATA (No Dependencies)
-- =========================================================

-- 1.1 Seed Rumah
INSERT INTO rumah (alamat, rt, rw, status_kepemilikan)
VALUES
('Jl. Melati No. 10', '01', '02', 'Milik Sendiri'),
('Jl. Mawar No. 12', '02', '03', 'Sewa'),
('Jl. Kenanga No. 8', '01', '03', 'Milik Sendiri');

-- 1.2 Seed Kelompok Ronda
INSERT INTO kelompok_ronda (nama_kelompok, jadwal_hari)
VALUES
('Kelompok Ronda A', 'Senin'),
('Kelompok Ronda B', 'Selasa');

-- 1.3 Seed Jenis Dana
INSERT INTO jenis_dana (nama_dana, deskripsi, nominal_default, periode_bayar, is_active)
VALUES
('Iuran Kebersihan', 'Iuran untuk kebersihan lingkungan', 50000.00, 'bulanan', 1),
('Iuran Keamanan', 'Iuran untuk keamanan lingkungan (ronda)', 30000.00, 'bulanan', 1),
('Sumbangan Sukarela', 'Sumbangan sukarela untuk kegiatan warga', 0.00, 'harian', 1);

-- =========================================================
-- STEP 2: SEED WARGA (Depends on: rumah)
-- =========================================================

-- MD5 hash dari '1234' = 81dc9bdb52d04dc20036dbd8313ed055
INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, password_custom)
VALUES
(1, 'Budi Santoso', '3501010101000001', '081234567890', 'L', '81dc9bdb52d04dc20036dbd8313ed055'),
(1, 'Siti Aminah', '3501010101000002', '081234567891', 'P', '81dc9bdb52d04dc20036dbd8313ed055'),
(2, 'Andi Prasetyo', '3501010101000003', '081234567892', 'L', '81dc9bdb52d04dc20036dbd8313ed055'),
(3, 'Dewi Lestari', '3501010101000004', '081234567893', 'P', '81dc9bdb52d04dc20036dbd8313ed055');

-- =========================================================
-- STEP 3: SEED PETUGAS (Depends on: warga, kelompok_ronda)
-- =========================================================

-- Password MD5 hash:
-- admin123 = 0192023a7bbd73250516f069df18b500
-- siti123  = 6562c5c1f33db6e05a082a88cddab5ea
-- andi123  = 0b4e7a0e5fe84ad35fb5f95b9ceeac79

INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password)
VALUES
(1, 1, 'Ketua Ronda', 'Admin', 'Aktif', 'admin_ronda', '0192023a7bbd73250516f069df18b500'),
(2, 1, 'Anggota', 'Petugas', 'Aktif', 'siti_petugas', '6562c5c1f33db6e05a082a88cddab5ea'),
(3, 2, 'Anggota', 'Petugas', 'Aktif', 'andi_petugas', '0b4e7a0e5fe84ad35fb5f95b9ceeac79');

-- =========================================================
-- VERIFICATION QUERY
-- =========================================================

SELECT 'SEED COMPLETED SUCCESSFULLY!' as Status;

SELECT 
    (SELECT COUNT(*) FROM rumah) as total_rumah,
    (SELECT COUNT(*) FROM kelompok_ronda) as total_kelompok_ronda,
    (SELECT COUNT(*) FROM warga) as total_warga,
    (SELECT COUNT(*) FROM petugas) as total_petugas,
    (SELECT COUNT(*) FROM jenis_dana) as total_jenis_dana;

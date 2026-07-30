-- =========================================================
-- SEED DATA: presensi
-- =========================================================
USE fundraising_dbcopyyy;

INSERT INTO presensi 
(id_warga, id_kelompok_ronda, tanggal, check_in, check_out, keterangan, status, created_at, updated_at, id_petugas) 
VALUES
-- Kelompok Ronda 1
(1, 1, '2025-10-27', '2025-10-27 20:00:00', '2025-10-28 05:00:00', NULL, 'Hadir', '2025-10-28 05:00:00', '2025-10-28 05:00:00', NULL),
(2, 1, '2025-10-27', '2025-10-27 20:15:00', NULL, 'izin pulang kampung', 'Izin', '2025-10-28 05:00:00', '2025-10-28 05:00:00', NULL),
(3, 1, '2025-10-27', '2025-10-27 21:00:00', '2025-10-28 05:10:00', NULL, 'Hadir', '2025-10-28 05:10:00', '2025-10-28 05:10:00', NULL),

-- Kelompok Ronda 2
(4, 2, '2025-10-27', '2025-10-27 20:30:00', '2025-10-28 05:20:00', NULL, 'Hadir', '2025-10-28 05:20:00', '2025-10-28 05:20:00', NULL),

-- Kelompok Ronda 3
(5, 3, '2025-10-27', '2025-10-27 20:40:00', NULL, 'Anak sakit', 'Izin', '2025-10-28 05:30:00', '2025-10-28 05:30:00', NULL),

-- Kelompok Ronda 4
(6, 4, '2025-10-27', '2025-10-27 21:00:00', '2025-10-28 05:40:00', NULL, 'Hadir', '2025-10-28 05:40:00', '2025-10-28 05:40:00', NULL);

SELECT 'Data presensi berhasil di-insert!' AS status;

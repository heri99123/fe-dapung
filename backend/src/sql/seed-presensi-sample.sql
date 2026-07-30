-- =========================================================
-- SEED SAMPLE DATA PRESENSI untuk Testing Filter
-- =========================================================
USE fundraising_dbcopyyy;

-- Pastikan tabel sudah ada dan status sudah di-alter
-- Jalankan alter-presensi-status.sql terlebih dahulu jika belum

-- Hapus data presensi lama (opsional, hati-hati!)
-- DELETE FROM presensi WHERE id_presensi > 0;

-- Insert data presensi untuk beberapa hari terakhir
-- Asumsi: ada minimal 5 warga yang juga petugas dengan id_warga 1-5

-- Kemarin malam (untuk default view)
INSERT INTO presensi (id_warga, id_kelompok_ronda, id_petugas, tanggal, check_in, check_out, status, keterangan) VALUES
(1, 1, 1, CURDATE() - INTERVAL 1 DAY, CONCAT(CURDATE() - INTERVAL 1 DAY, ' 20:00:00'), CONCAT(CURDATE() - INTERVAL 1 DAY, ' 23:00:00'), 'Hadir', NULL),
(2, 1, 2, CURDATE() - INTERVAL 1 DAY, CONCAT(CURDATE() - INTERVAL 1 DAY, ' 20:15:00'), CONCAT(CURDATE() - INTERVAL 1 DAY, ' 23:10:00'), 'Hadir', NULL),
(3, 2, 3, CURDATE() - INTERVAL 1 DAY, NULL, NULL, 'Izin', 'Ada acara keluarga'),
(4, 2, 4, CURDATE() - INTERVAL 1 DAY, NULL, NULL, 'Sakit', 'Demam tinggi'),
(5, 3, 5, CURDATE() - INTERVAL 1 DAY, NULL, NULL, 'Alpha', NULL);

-- 2 hari yang lalu
INSERT INTO presensi (id_warga, id_kelompok_ronda, id_petugas, tanggal, check_in, check_out, status, keterangan) VALUES
(1, 1, 1, CURDATE() - INTERVAL 2 DAY, CONCAT(CURDATE() - INTERVAL 2 DAY, ' 20:00:00'), CONCAT(CURDATE() - INTERVAL 2 DAY, ' 23:00:00'), 'Hadir', NULL),
(2, 1, 2, CURDATE() - INTERVAL 2 DAY, CONCAT(CURDATE() - INTERVAL 2 DAY, ' 20:05:00'), CONCAT(CURDATE() - INTERVAL 2 DAY, ' 23:05:00'), 'Hadir', NULL),
(3, 2, 3, CURDATE() - INTERVAL 2 DAY, CONCAT(CURDATE() - INTERVAL 2 DAY, ' 20:10:00'), CONCAT(CURDATE() - INTERVAL 2 DAY, ' 23:00:00'), 'Hadir', NULL),
(4, 2, 4, CURDATE() - INTERVAL 2 DAY, NULL, NULL, 'Izin', 'Tugas kantor'),
(5, 3, 5, CURDATE() - INTERVAL 2 DAY, NULL, NULL, 'Alpha', NULL);

-- 3 hari yang lalu
INSERT INTO presensi (id_warga, id_kelompok_ronda, id_petugas, tanggal, check_in, check_out, status, keterangan) VALUES
(1, 1, 1, CURDATE() - INTERVAL 3 DAY, CONCAT(CURDATE() - INTERVAL 3 DAY, ' 20:00:00'), CONCAT(CURDATE() - INTERVAL 3 DAY, ' 23:00:00'), 'Hadir', NULL),
(2, 1, 2, CURDATE() - INTERVAL 3 DAY, NULL, NULL, 'Sakit', 'Flu'),
(3, 2, 3, CURDATE() - INTERVAL 3 DAY, CONCAT(CURDATE() - INTERVAL 3 DAY, ' 20:10:00'), CONCAT(CURDATE() - INTERVAL 3 DAY, ' 23:00:00'), 'Hadir', NULL),
(4, 2, 4, CURDATE() - INTERVAL 3 DAY, CONCAT(CURDATE() - INTERVAL 3 DAY, ' 20:20:00'), CONCAT(CURDATE() - INTERVAL 3 DAY, ' 23:00:00'), 'Hadir', NULL),
(5, 3, 5, CURDATE() - INTERVAL 3 DAY, CONCAT(CURDATE() - INTERVAL 3 DAY, ' 20:30:00'), CONCAT(CURDATE() - INTERVAL 3 DAY, ' 23:00:00'), 'Hadir', NULL);

-- 7 hari yang lalu (untuk test filter tanggal)
INSERT INTO presensi (id_warga, id_kelompok_ronda, id_petugas, tanggal, check_in, check_out, status, keterangan) VALUES
(1, 1, 1, CURDATE() - INTERVAL 7 DAY, CONCAT(CURDATE() - INTERVAL 7 DAY, ' 20:00:00'), CONCAT(CURDATE() - INTERVAL 7 DAY, ' 23:00:00'), 'Hadir', NULL),
(2, 1, 2, CURDATE() - INTERVAL 7 DAY, CONCAT(CURDATE() - INTERVAL 7 DAY, ' 20:05:00'), CONCAT(CURDATE() - INTERVAL 7 DAY, ' 23:05:00'), 'Hadir', NULL),
(3, 2, 3, CURDATE() - INTERVAL 7 DAY, CONCAT(CURDATE() - INTERVAL 7 DAY, ' 20:10:00'), CONCAT(CURDATE() - INTERVAL 7 DAY, ' 23:00:00'), 'Hadir', NULL),
(4, 2, 4, CURDATE() - INTERVAL 7 DAY, CONCAT(CURDATE() - INTERVAL 7 DAY, ' 20:20:00'), CONCAT(CURDATE() - INTERVAL 7 DAY, ' 23:00:00'), 'Hadir', NULL),
(5, 3, 5, CURDATE() - INTERVAL 7 DAY, NULL, NULL, 'Izin', 'Dinas luar kota');

-- Data bulan lalu (untuk test filter bulan)
-- Insert 10 records dengan tanggal bulan lalu
INSERT INTO presensi (id_warga, id_kelompok_ronda, id_petugas, tanggal, check_in, check_out, status, keterangan) VALUES
-- Minggu pertama bulan lalu
(1, 1, 1, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05'), ' 20:00:00'), NULL, 'Hadir', NULL),
(2, 1, 2, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05'), ' 20:05:00'), NULL, 'Hadir', NULL),
(3, 2, 3, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-05'), NULL, NULL, 'Izin', 'Acara keluarga'),

-- Minggu kedua bulan lalu  
(1, 1, 1, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'), ' 20:00:00'), NULL, 'Hadir', NULL),
(2, 1, 2, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'), ' 20:05:00'), NULL, 'Hadir', NULL),
(4, 2, 4, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'), NULL, NULL, 'Sakit', 'Demam'),

-- Minggu ketiga bulan lalu
(1, 1, 1, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'), ' 20:00:00'), NULL, 'Hadir', NULL),
(3, 2, 3, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'), ' 20:10:00'), NULL, 'Hadir', NULL),
(5, 3, 5, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'), NULL, NULL, 'Alpha', NULL),

-- Minggu keempat bulan lalu
(2, 1, 2, DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-26'), CONCAT(DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-26'), ' 20:05:00'), NULL, 'Hadir', NULL);

-- Verifikasi data yang sudah diinsert
SELECT 'Data presensi berhasil ditambahkan!' AS status;

-- Tampilkan statistik
SELECT 
    DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
    COUNT(*) AS total_presensi,
    SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) AS hadir,
    SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) AS izin,
    SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) AS sakit,
    SUM(CASE WHEN status = 'Alpha' THEN 1 ELSE 0 END) AS alpha
FROM presensi
GROUP BY tanggal
ORDER BY tanggal DESC
LIMIT 10;

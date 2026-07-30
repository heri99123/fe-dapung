-- =========================================================
-- SEED DATA: laporan
-- =========================================================
USE fundraising_dbcopyyy;

-- Contoh data laporan bulanan
INSERT INTO laporan (id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar, created_at, updated_at) VALUES
-- Laporan bulan 11/2025
(1, 1, 1, 'November', 2025, 150000.00, 155000.00, 'Sudah Bayar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 2, 'November', 2025, 140000.00, 145000.00, 'Belum Bayar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 3, 'November', 2025, 145000.00, 145000.00, 'Sudah Bayar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

SELECT 'Data laporan berhasil di-insert!' AS status;

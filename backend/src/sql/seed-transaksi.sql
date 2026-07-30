-- =========================================================
-- SEED DATA: transaksi
-- =========================================================
USE fundraising_dbcopyyy;

INSERT INTO transaksi 
(id_warga, id_user, tanggal_setor, waktu_input, nominal, status_jimpitan, id_rumah, id_jenis_dana, jumlah_bayar, tanggal_bayar, jenis_transaksi, status, created_at, updated_at) 
VALUES

-- Transaksi Jimpitan Harian
(1, 1, '2025-10-28', '2025-10-28 21:14:50', 30000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending', '2025-10-28 21:14:50', '2025-10-28 21:14:50'),
(2, 1, '2025-10-27', '2025-10-27 09:07:03', 30000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending', '2025-10-27 09:07:03', '2025-10-27 09:07:03'),
(3, 1, '2025-10-27', '2025-10-27 09:45:22', 30000.00, 'lunas', NULL, 1, 0.00, NULL, 'Masuk', 'Pending', '2025-10-27 09:45:22', '2025-10-27 09:45:22'),
(4, 1, '2025-11-01', '2025-11-01 20:13:44', 5000.00, 'lunas', NULL, 3, 0.00, NULL, 'Masuk', 'Pending', '2025-11-01 20:13:44', '2025-11-01 20:13:44'),

-- Transaksi Kas Ronda
(5, 1, '2025-11-04', '2025-11-04 09:36:59', 25000.00, 'lunas', NULL, 2, 0.00, NULL, 'Masuk', 'Pending', '2025-11-04 09:36:59', '2025-11-04 09:36:59'),
(3, 1, '2025-11-04', '2025-11-04 10:37:48', 5000.00, 'lunas', NULL, 2, 0.00, NULL, 'Masuk', 'Pending', '2025-11-04 10:37:48', '2025-11-04 10:37:48'),

-- Transaksi Dana Sosial
(6, 1, '2025-11-04', '2025-11-04 11:33:00', 30000.00, 'lunas', NULL, 2, 0.00, NULL, 'Masuk', 'Pending', '2025-11-04 11:33:00', '2025-11-04 11:33:00');

SELECT 'Data transaksi berhasil di-insert!' AS status;

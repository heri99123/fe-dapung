-- =========================================================
-- SEED DATA: jenis_dana
-- =========================================================
USE fundraising_dbcopyyy;

INSERT INTO jenis_dana (nama_dana, deskripsi, nominal_default, periode_bayar, is_active, created_at, updated_at) VALUES
('Jimpitan Harian', 'Dana hasil iuran jimpitan setiap malam ronda.', 500.00, 'harian', 1, '2025-11-20 09:59:44', '2025-11-20 14:26:47'),
('Kas Ronda', 'Dana kas kelompok ronda untuk kegiatan kebersamaan.', 0.00, 'harian', 1, '2025-11-20 09:59:44', '2025-11-23 09:59:44'),
('Dana Sosial', 'Dana sosial untuk membantu warga yang membutuhkan.', 0.00, 'harian', 1, '2025-11-20 09:59:44', '2025-11-23 09:59:44');

SELECT 'Data jenis_dana berhasil di-insert!' AS status;
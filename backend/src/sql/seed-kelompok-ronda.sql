-- =========================================================
-- SEED DATA: kelompok_ronda
-- =========================================================
USE fundraising_dbcopyyy;

INSERT INTO kelompok_ronda (nama_kelompok, jadwal_hari) VALUES
('Kelompok Senin', 'Senin'),
('Kelompok Selasa', 'Selasa'),
('Kelompok Rabu', 'Rabu'),
('Kelompok Kamis', 'Kamis'),
('Kelompok Jumat', 'Jumat'),
('Kelompok Sabtu', 'Sabtu'),
('Kelompok Minggu', 'Minggu');

SELECT 'Data kelompok_ronda berhasil di-insert!' AS status;

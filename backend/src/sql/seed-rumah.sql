-- =========================================================
-- SEED DATA: rumah
-- =========================================================
USE fundraising_dbcopyyy;

-- Contoh data rumah
INSERT INTO rumah (alamat, rt, rw, kode_barcode, status_kepemilikan, id_kepala_keluarga) VALUES
('Jl. Mawar No. 10', '01', '02', 'RMH001', 'Milik Sendiri', NULL),
('Jl. Melati No. 15', '02', '02', 'RMH002', 'Milik Sendiri', NULL),
('Jl. Anggrek No. 20', '01', '03', 'RMH003', 'Sewa', NULL),
('Jl. Kenanga No. 25', '03', '01', 'RMH004', 'Milik Sendiri', NULL),
('Jl. Dahlia No. 30', '02', '01', 'RMH005', 'Kontrak', NULL);

-- Note: id_kepala_keluarga akan diupdate setelah insert warga
SELECT 'Data rumah berhasil di-insert!' AS status;
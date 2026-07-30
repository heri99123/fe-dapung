-- =========================================================
-- SEED DATA: petugas
-- =========================================================
USE fundraising_dbcopyyy;

-- Password MD5 hash:
-- admin123 = 0192023a7bbd73250516f069df18b500

INSERT INTO petugas (id_warga, id_kelompok_ronda, jabatan, role, status, username, password) VALUES
-- SuperAdmin
(1, NULL, 'Ketua RT', 'SuperAdmin', 'Aktif', 'superadmin', MD5('admin123')),

-- Admin
(2, NULL, 'Sekretaris', 'Admin', 'Aktif', 'admin', MD5('admin123')),

-- Petugas  
(3, 1, 'Bendahara', 'Petugas', 'Aktif', 'petugas1', MD5('petugas123')),
(5, 3, 'Koordinator Ronda', 'Petugas', 'Aktif', 'petugas2', MD5('petugas123')),
(7, 5, 'Anggota Ronda', 'Petugas', 'Aktif', 'petugas3', MD5('petugas123'));

SELECT 'Data petugas berhasil di-insert! SuperAdmin: superadmin/admin123' AS status;
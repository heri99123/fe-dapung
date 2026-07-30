-- =========================================================
-- SEED DATA: warga
-- =========================================================
USE fundraising_dbcopyyy;

-- Contoh data warga (password default: 1234 dalam MD5 hash)
INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, status_aktif, password_custom, email, alamat) VALUES
-- Rumah 1
(1, 'Budi Santoso', '3310010101900001', '081234567801', 'Laki-laki', 'Aktif', MD5('1234'), NULL, NULL),
(1, 'Siti Aminah', '3310010202900002', '081234567802', 'Perempuan', 'Aktif', MD5('1234'), NULL, NULL),

-- Rumah 2
(2, 'Ahmad Yani', '3310020101850003', '081234567803', 'Laki-laki', 'Aktif', MD5('1234'), NULL, NULL),
(2, 'Dewi Lestari', '3310020202880004', '081234567804', 'Perempuan', 'Aktif', MD5('1234'), NULL, NULL),

-- Rumah 3
(3, 'Eko Prasetyo', '3310030101920005', '081234567805', 'Laki-laki', 'Aktif', MD5('1234'), NULL, NULL),

-- Rumah 4
(4, 'Rini Susanti', '3310040202910006', '081234567806', 'Perempuan', 'Aktif', MD5('1234'), NULL, NULL),

-- Rumah 5
(5, 'Hadi Wijaya', '3310050101870007', '081234567807', 'Laki-laki', 'Aktif', MD5('1234'), NULL, NULL),
(5, 'Sri Wahyuni', '3310050202890008', '081234567808', 'Perempuan', 'Aktif', MD5('1234'), NULL, NULL);

-- Update id_kepala_keluarga di tabel rumah (asumsi AUTO_INCREMENT dimulai dari 1)
UPDATE rumah SET id_kepala_keluarga = 1 WHERE id_rumah = 1; -- Budi Santoso
UPDATE rumah SET id_kepala_keluarga = 3 WHERE id_rumah = 2; -- Ahmad Yani
UPDATE rumah SET id_kepala_keluarga = 5 WHERE id_rumah = 3; -- Eko Prasetyo
UPDATE rumah SET id_kepala_keluarga = 6 WHERE id_rumah = 4; -- Rini Susanti
UPDATE rumah SET id_kepala_keluarga = 7 WHERE id_rumah = 5; -- Hadi Wijaya

SELECT 'Data warga berhasil di-insert! Password default: 1234' AS status;
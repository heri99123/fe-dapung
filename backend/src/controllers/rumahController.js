// backend/controllers/rumahController.js
import { pool } from "../config/database.js";

// =====================================================
// GET: Ambil semua data rumah (termasuk nama kepala keluarga & jumlah penghuni)
// =====================================================
export const getAllRumah = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id_rumah AS id,
        r.alamat,
        r.rt,
        r.rw,
        r.kode_barcode AS kodeBarcode,
        r.status_kepemilikan AS statusKepemilikan,
        r.id_kepala_keluarga AS idKepalaKeluarga,
        w.nama_lengkap AS kepalaKeluarga,
        (
          SELECT COUNT(*) 
          FROM warga ww 
          WHERE ww.id_rumah = r.id_rumah
        ) AS jumlahPenghuni
      FROM rumah r
      LEFT JOIN warga w ON w.id_warga = r.id_kepala_keluarga
      ORDER BY r.id_rumah DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengambil data rumah", 
      error: error.message 
    });
  }
};

// =====================================================
// GET: Ambil detail rumah berdasarkan ID (termasuk daftar penghuni)
// =====================================================
export const getRumahById = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data rumah & kepala keluarga
    const [rumah] = await pool.query(`
      SELECT 
        r.id_rumah AS id,
        r.alamat,
        r.rt,
        r.rw,
        r.kode_barcode AS kodeBarcode,
        r.status_kepemilikan AS statusKepemilikan,
        r.id_kepala_keluarga AS idKepalaKeluarga,
        w.nama_lengkap AS kepalaKeluarga
      FROM rumah r
      LEFT JOIN warga w ON w.id_warga = r.id_kepala_keluarga
      WHERE r.id_rumah = ?
    `, [id]);

    if (rumah.length === 0) {
      return res.status(404).json({ success: false, message: "Rumah tidak ditemukan" });
    }

    // Ambil daftar penghuni rumah
    const [penghuni] = await pool.query(`
      SELECT 
        id_warga AS idWarga,
        nama_lengkap AS namaLengkap,
        nik,
        jenis_kelamin AS jenisKelamin,
        status_aktif AS statusAktif
      FROM warga
      WHERE id_rumah = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...rumah[0],
        jumlahPenghuni: penghuni.length,
        penghuni
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengambil detail rumah", 
      error: error.message 
    });
  }
};

// =====================================================
// POST: Tambah rumah baru
// =====================================================
export const createRumah = async (req, res) => {
  try {
    const { alamat, rt, rw, kodeBarcode, statusKepemilikan, idKepalaKeluarga } = req.body;
    
    // Debug: Log data yang diterima
    console.log("DEBUG - Data received:", { alamat, rt, rw, kodeBarcode, statusKepemilikan, idKepalaKeluarga });

    if (!alamat) {
      return res.status(400).json({ success: false, message: "Alamat wajib diisi" });
    }

    // Pastikan statusKepemilikan tidak kosong
    const finalStatusKepemilikan = statusKepemilikan && statusKepemilikan.trim() !== "" ? statusKepemilikan : "Milik Sendiri";
    
    console.log("DEBUG - Final status:", finalStatusKepemilikan);

    const [result] = await pool.query(`
      INSERT INTO rumah (alamat, rt, rw, kode_barcode, status_kepemilikan, id_kepala_keluarga)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [alamat, rt || null, rw || null, kodeBarcode || null, finalStatusKepemilikan, idKepalaKeluarga || null]);

    res.status(201).json({ 
      success: true, 
      message: "Rumah berhasil ditambahkan", 
      data: { id: result.insertId } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Gagal menambahkan rumah", 
      error: error.message 
    });
  }
};

// =====================================================
// PUT: Update data rumah
// =====================================================
export const updateRumah = async (req, res) => {
  try {
    const { id } = req.params;
    const { alamat, rt, rw, kodeBarcode, statusKepemilikan, idKepalaKeluarga } = req.body;

    // Debug: Log data yang diterima untuk update
    console.log("DEBUG UPDATE - Data received:", { id, alamat, rt, rw, kodeBarcode, statusKepemilikan, idKepalaKeluarga });
    
    // Pastikan statusKepemilikan tidak kosong
    const finalStatusKepemilikan = statusKepemilikan && statusKepemilikan.trim() !== "" ? statusKepemilikan : "Milik Sendiri";
    
    console.log("DEBUG UPDATE - Final status:", finalStatusKepemilikan);

    const [result] = await pool.query(`
      UPDATE rumah
      SET alamat = ?, rt = ?, rw = ?, kode_barcode = ?, 
          status_kepemilikan = ?, id_kepala_keluarga = ?, updated_at = NOW()
      WHERE id_rumah = ?
    `, [alamat, rt, rw, kodeBarcode, finalStatusKepemilikan, idKepalaKeluarga || null, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Rumah tidak ditemukan" });
    }

    res.json({ success: true, message: "Data rumah berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Gagal memperbarui rumah", 
      error: error.message 
    });
  }
};

// =====================================================
// DELETE: Hapus rumah
// =====================================================
export const deleteRumah = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM rumah WHERE id_rumah = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Rumah tidak ditemukan" });
    }

    res.json({ success: true, message: "Data rumah berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Gagal menghapus rumah", 
      error: error.message 
    });
  }
};

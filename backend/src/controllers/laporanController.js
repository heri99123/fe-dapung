// backend/controllers/laporanController.js
import { pool } from "../config/database.js";

export const createLaporan = async (req, res) => {
  try {
    const { id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar } = req.body;
    const [result] = await pool.query(
      `INSERT INTO laporan (id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_rumah || null, id_jenis_dana || null, id_kelompok_ronda || null, bulan || null, tahun || null, total_jimpitan || 0, total_transaksi || 0, status_bayar || "Belum Bayar"]
    );
    res.status(201).json({ success: true, message: "Laporan berhasil ditambahkan", id_laporan: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAllLaporan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.id_laporan, r.alamat AS alamatRumah, jd.nama_dana AS namaJenisDana, kr.nama_kelompok AS namaKelompok,
             l.bulan, l.tahun, l.total_jimpitan, l.total_transaksi, l.status_bayar, l.created_at, l.updated_at
      FROM laporan l
      LEFT JOIN rumah r ON l.id_rumah = r.id_rumah
      LEFT JOIN jenis_dana jd ON l.id_jenis_dana = jd.id_jenis_dana
      LEFT JOIN kelompok_ronda kr ON l.id_kelompok_ronda = kr.id_kelompok_ronda
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getLaporanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM laporan WHERE id_laporan = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_rumah, id_jenis_dana, id_kelompok_ronda, bulan, tahun, total_jimpitan, total_transaksi, status_bayar } = req.body;
    const [result] = await pool.query(
      `UPDATE laporan SET id_rumah=?, id_jenis_dana=?, id_kelompok_ronda=?, bulan=?, tahun=?, total_jimpitan=?, total_transaksi=?, status_bayar=?, updated_at = NOW()
       WHERE id_laporan=?`,
      [id_rumah || null, id_jenis_dana || null, id_kelompok_ronda || null, bulan || null, tahun || null, total_jimpitan || 0, total_transaksi || 0, status_bayar || "Belum Bayar", id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, message: "Laporan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteLaporan = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM laporan WHERE id_laporan = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Laporan tidak ditemukan" });
    res.json({ success: true, message: "Laporan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

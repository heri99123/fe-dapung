// backend/controllers/kelompokRondaController.js
import { pool } from "../config/database.js"

export const getAllKelompokRonda = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_kelompok_ronda AS id, 
        nama_kelompok AS namaKelompok, 
        COALESCE(jadwal_hari, '') AS jadwalHari,
        created_at, 
        updated_at 
      FROM kelompok_ronda 
      ORDER BY id_kelompok_ronda DESC
    `)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kelompok ronda",
      error: error.message,
    })
  }
}

export const getKelompokRondaById = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `
      SELECT 
        id_kelompok_ronda AS id, 
        nama_kelompok AS namaKelompok, 
        COALESCE(jadwal_hari, '') AS jadwalHari 
      FROM kelompok_ronda 
      WHERE id_kelompok_ronda = ?
    `,
      [id],
    )

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Kelompok ronda tidak ditemukan" })

    res.json({ success: true, data: rows[0] })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data",
      error: error.message,
    })
  }
}

export const createKelompokRonda = async (req, res) => {
  try {
    const { namaKelompok, jadwalHari } = req.body
    if (!namaKelompok) return res.status(400).json({ success: false, message: "namaKelompok wajib diisi" })
    const [result] = await pool.query("INSERT INTO kelompok_ronda (nama_kelompok, jadwal_hari) VALUES (?, ?)", [
      namaKelompok,
      jadwalHari || null,
    ])
    res.status(201).json({
      success: true,
      message: "Kelompok ronda berhasil ditambahkan",
      data: { id: result.insertId, namaKelompok, jadwalHari },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah", error: error.message })
  }
}

export const updateKelompokRonda = async (req, res) => {
  try {
    const { id } = req.params
    const { namaKelompok, jadwalHari } = req.body
    const [result] = await pool.query(
      "UPDATE kelompok_ronda SET nama_kelompok = ?, jadwal_hari = ?, updated_at = NOW() WHERE id_kelompok_ronda = ?",
      [namaKelompok, jadwalHari || null, id],
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Kelompok ronda tidak ditemukan" })
    res.json({ success: true, message: "Data berhasil diperbarui" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui", error: error.message })
  }
}

export const deleteKelompokRonda = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query("DELETE FROM kelompok_ronda WHERE id_kelompok_ronda = ?", [id])
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Kelompok ronda tidak ditemukan" })
    res.json({ success: true, message: "Data berhasil dihapus" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus", error: error.message })
  }
}

export const getAnggotaByKelompokId = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query(
      `
      SELECT 
        p.id_petugas AS id,
        w.nama_lengkap AS namaLengkap,
        w.nik,
        p.jabatan,
        p.role,
        p.status
      FROM petugas p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      WHERE p.id_kelompok_ronda = ?
      ORDER BY p.id_petugas DESC
    `,
      [id],
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil anggota kelompok ronda",
      error: error.message,
    })
  }
}

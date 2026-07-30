// backend/controllers/jenisDanaController.js
import { pool } from "../config/database.js";

export const getAllJenisDana = async (req, res) => {
  try {
    // Try new schema first, fallback to old schema if columns don't exist
    let query = `
      SELECT 
        id_jenis_dana AS id, 
        nama_dana AS namaDana, 
        deskripsi,
        created_at, 
        updated_at
    `;
    
    // Check if new columns exist
    try {
      const [testQuery] = await pool.query("SELECT nominal_default, periode_bayar, is_active FROM jenis_dana LIMIT 1");
      // If successful, use full query with new columns
      query = `
        SELECT 
          id_jenis_dana AS id, 
          nama_dana AS namaDana, 
          deskripsi,
          COALESCE(nominal_default, 0) AS nominalDefault,
          COALESCE(periode_bayar, 'harian') AS periodeBayar,
          COALESCE(is_active, 1) AS isActive,
          created_at, 
          updated_at 
        FROM jenis_dana 
        ORDER BY created_at DESC
      `;
    } catch (columnError) {
      // Fallback to basic query for old schema
      query += ` FROM jenis_dana ORDER BY created_at DESC`;
    }
    
    const [rows] = await pool.query(query);
    
    // Ensure all rows have required fields with defaults
    const mappedRows = rows.map(row => ({
      ...row,
      nominalDefault: row.nominalDefault ?? 0,
      periodeBayar: row.periodeBayar ?? 'harian',
      isActive: row.isActive !== undefined ? Boolean(row.isActive) : true
    }));
    
    res.json({ success: true, data: mappedRows });
  } catch (error) {
    console.error("Error getting all jenis dana:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data", error: error.message });
  }
};

export const getJenisDanaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        id_jenis_dana AS id, 
        nama_dana AS namaDana, 
        deskripsi,
        COALESCE(nominal_default, 0) AS nominalDefault,
        COALESCE(periode_bayar, 'harian') AS periodeBayar,
        COALESCE(is_active, 1) AS isActive
      FROM jenis_dana 
      WHERE id_jenis_dana = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }
    
    const jenisDana = {
      ...rows[0],
      isActive: Boolean(rows[0].isActive)
    };
    
    res.json({ success: true, data: jenisDana });
  } catch (error) {
    console.error("Error getting jenis dana by id:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data", error: error.message });
  }
};

export const createJenisDana = async (req, res) => {
  try {
    const { namaDana, deskripsi, nominalDefault, periodeBayar, isActive } = req.body;
    
    console.log("DEBUG CREATE JENIS DANA - Data received:", { namaDana, deskripsi, nominalDefault, periodeBayar, isActive });
    
    if (!namaDana) {
      return res.status(400).json({ success: false, message: "Nama dana wajib diisi" });
    }

    const [result] = await pool.query(`
      INSERT INTO jenis_dana (nama_dana, deskripsi, nominal_default, periode_bayar, is_active) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      namaDana, 
      deskripsi || null, 
      nominalDefault || 0, 
      periodeBayar || 'harian', 
      isActive ? 1 : 0
    ]);
    
    res.status(201).json({ 
      success: true, 
      message: "Data berhasil ditambahkan", 
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error("Error creating jenis dana:", error);
    res.status(500).json({ success: false, message: "Gagal menambahkan data", error: error.message });
  }
};

export const updateJenisDana = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaDana, deskripsi, nominalDefault, periodeBayar, isActive } = req.body;
    
    console.log("DEBUG UPDATE JENIS DANA - Data received:", { id, namaDana, deskripsi, nominalDefault, periodeBayar, isActive });
    
    const [result] = await pool.query(`
      UPDATE jenis_dana 
      SET nama_dana = ?, deskripsi = ?, nominal_default = ?, periode_bayar = ?, is_active = ?, updated_at = NOW() 
      WHERE id_jenis_dana = ?
    `, [
      namaDana, 
      deskripsi || null, 
      nominalDefault || 0, 
      periodeBayar || 'harian', 
      isActive ? 1 : 0, 
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }
    
    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating jenis dana:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui data", error: error.message });
  }
};

export const deleteJenisDana = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM jenis_dana WHERE id_jenis_dana = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    res.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus data", error: error.message });
  }
};

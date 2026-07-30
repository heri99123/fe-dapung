// backend/controllers/petugasController.js
import { pool } from "../config/database.js"
import crypto from "crypto"

// Helper function to hash password with MD5
const hashPasswordMD5 = (password) => {
  return crypto.createHash('md5').update(password).digest('hex')
}

export const getAllPetugas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_petugas AS id, p.id_warga, p.id_kelompok_ronda AS kelompokId, 
             w.nama_lengkap AS namaWarga, w.nik, 
             kr.nama_kelompok AS namaKelompok, kr.jadwal_hari AS jadwalHari,
             p.jabatan, p.role, p.status, p.username, p.created_at, p.updated_at
      FROM petugas p
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
      ORDER BY p.id_petugas DESC
    `)
    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data petugas", error: error.message })
  }
}

export const getPetugasById = async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.query("SELECT * FROM petugas WHERE id_petugas = ?", [id])
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" })
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil petugas", error: error.message })
  }
}

export const createPetugas = async (req, res) => {
  try {
    const { idWarga, jabatan, role, statusUser, username, password, idKelompokRonda } = req.body

    console.log("DEBUG CREATE PETUGAS - Data received:", {
      idWarga,
      jabatan,
      role,
      statusUser,
      username,
      idKelompokRonda,
    })

    if (!idWarga) {
      return res.status(400).json({ success: false, message: "idWarga wajib diisi" })
    }
    if (!username) {
      return res.status(400).json({ success: false, message: "Username wajib diisi" })
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password wajib diisi" })
    }

    const status = statusUser ? "Aktif" : "Tidak Aktif"

    const allowedRoles = ["SuperAdmin", "Admin", "Petugas", "Warga"]
    const userRole = allowedRoles.includes(role) ? role : "Petugas"

    // Hash password dengan MD5 sebelum disimpan
    const hashedPassword = hashPasswordMD5(password)

    const [result] = await pool.query(
      "INSERT INTO petugas (id_warga, jabatan, role, status, username, password, id_kelompok_ronda) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [idWarga, jabatan || null, userRole, status, username, hashedPassword, idKelompokRonda || null]
    )

    res.status(201).json({
      success: true,
      message: "Petugas dengan role ${userRole} berhasil ditambahkan",
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("Error creating petugas:", error)
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan petugas",
      error: error.message,
})
}
}


export const updatePetugas = async (req, res) => {
  try {
    const { id } = req.params
    const { jabatan, role, statusUser, username, password, idKelompokRonda } = req.body

    console.log("DEBUG UPDATE PETUGAS - Data received:", {
      id,
      jabatan,
      role,
      statusUser,
      username,
      idKelompokRonda,
    })

    if (!username) {
      return res.status(400).json({ success: false, message: "Username wajib diisi" })
    }

    const status = statusUser ? "Aktif" : "Tidak Aktif"

    const allowedRoles = ["SuperAdmin", "Admin", "Petugas", "Warga"]
    const userRole = allowedRoles.includes(role) ? role : "Petugas"

    console.log("DEBUG UPDATE PETUGAS - Role validation:", {
      receivedRole: role,
      finalRole: userRole,
      isAllowed: allowedRoles.includes(role)
    })

    let updateQuery =
      "UPDATE petugas SET jabatan = ?, role = ?, status = ?, username = ?, id_kelompok_ronda = ?, updated_at = NOW()"
    const queryParams = [jabatan || null, userRole, status, username, idKelompokRonda || null]

    if (password && password.trim() !== "") {
      // Hash password dengan MD5 sebelum update
      const hashedPassword = hashPasswordMD5(password)
      updateQuery += ", password = ?"
      queryParams.push(hashedPassword)
    }

    updateQuery += " WHERE id_petugas = ?"
    queryParams.push(id)

    console.log("DEBUG UPDATE PETUGAS - SQL:", {
      query: updateQuery,
      params: queryParams
    })

    const [result] = await pool.query(updateQuery, queryParams)

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" })
    }

    console.log("DEBUG UPDATE PETUGAS - Success! Affected rows:", result.affectedRows)

    res.json({ success: true, message: `Data petugas dengan role ${userRole} berhasil diperbarui` })
  } catch (error) {
    console.error("Error updating petugas:", error)
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui petugas",
      error: error.message,
    })
  }
}


export const deletePetugas = async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query("DELETE FROM petugas WHERE id_petugas = ?", [id])
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Petugas tidak ditemukan" })
    res.json({ success: true, message: "Data petugas berhasil dihapus" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus petugas", error: error.message })
  }
}

// Helper function untuk mengecek apakah kelompok ronda sesuai jadwal hari tertentu
function isScheduledForDate(jadwalHari, targetDate) {
  if (!jadwalHari) return false;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDay = days[targetDate.getDay()];
  const schedule = jadwalHari.toLowerCase();
  const targetDayLower = targetDay.toLowerCase();
  
  // Handle different schedule formats
  if (schedule.includes(' - ')) {
    // Format: "Senin - Rabu" atau "Kamis - Sabtu"
    const [startDay, endDay] = schedule.split(' - ').map(day => day.trim());
    
    const dayOrder = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const targetIndex = dayOrder.indexOf(targetDayLower);
    const startIndex = dayOrder.indexOf(startDay.toLowerCase());
    const endIndex = dayOrder.indexOf(endDay.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    // Handle wrap-around schedules (e.g., Sabtu - Senin)
    if (startIndex <= endIndex) {
      return targetIndex >= startIndex && targetIndex <= endIndex;
    } else {
      return targetIndex >= startIndex || targetIndex <= endIndex;
    }
  } else {
    // Single day format: "Sabtu", "Minggu", etc.
    return schedule === targetDayLower;
  }
}

// Check if current logged-in petugas has schedule for today
export const checkPetugasScheduleToday = async (req, res) => {
  try {
    const { id } = req.params; // id_petugas (default) atau id_warga
    const { checkBy } = req.query; // 'petugas' atau 'warga'
    
    console.log(`[CHECK SCHEDULE] id=${id}, checkBy=${checkBy}`);
    
    let query = '';
    let queryParams = [];
    
    if (checkBy === 'warga') {
      // Cek berdasarkan id_warga
      query = `
        SELECT p.id_petugas, p.id_warga, w.nama_lengkap, 
               kr.nama_kelompok, kr.jadwal_hari
        FROM petugas p
        LEFT JOIN warga w ON p.id_warga = w.id_warga
        LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
        WHERE p.id_warga = ? AND p.status = 'Aktif'
      `;
      queryParams = [id];
    } else {
      // Cek berdasarkan id_petugas (default)
      query = `
        SELECT p.id_petugas, p.id_warga, w.nama_lengkap, 
               kr.nama_kelompok, kr.jadwal_hari
        FROM petugas p
        LEFT JOIN warga w ON p.id_warga = w.id_warga
        LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
        WHERE p.id_petugas = ? AND p.status = 'Aktif'
      `;
      queryParams = [id];
    }
    
    console.log(`[CHECK SCHEDULE] Query:`, query.trim().replace(/\s+/g, ' '));
    console.log(`[CHECK SCHEDULE] Params:`, queryParams);
    
    const [rows] = await pool.query(query, queryParams);
    
    console.log(`[CHECK SCHEDULE] Rows found:`, rows.length);
    
    if (rows.length === 0) {
      console.log(`[CHECK SCHEDULE] Petugas not found for id=${id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Petugas tidak ditemukan atau tidak aktif" 
      });
    }
    
    const petugas = rows[0];
    console.log(`[CHECK SCHEDULE] Petugas data:`, {
      id_petugas: petugas.id_petugas,
      id_warga: petugas.id_warga,
      nama: petugas.nama_lengkap,
      kelompok: petugas.nama_kelompok,
      jadwal: petugas.jadwal_hari
    });
    
    const today = new Date();
    const hasScheduleToday = isScheduledForDate(petugas.jadwal_hari, today);
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = days[today.getDay()];
    
    console.log(`[CHECK SCHEDULE] Today: ${todayName}, HasSchedule: ${hasScheduleToday}`);
    
    res.json({
      success: true,
      data: {
        id_petugas: petugas.id_petugas,
        id_warga: petugas.id_warga,
        nama_lengkap: petugas.nama_lengkap,
        nama_kelompok: petugas.nama_kelompok,
        jadwal_hari: petugas.jadwal_hari,
        today: todayName,
        hasScheduleToday: hasScheduleToday
      }
    });
  } catch (error) {
    console.error("[CHECK SCHEDULE] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal mengecek jadwal petugas", 
      error: error.message 
    });
  }
}

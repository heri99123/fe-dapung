// backend/controllers/userController.js
import { pool } from "../config/database.js"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// Helper function to hash password with MD5
const hashPasswordMD5 = (password) => {
  return crypto.createHash('md5').update(password).digest('hex')
}

// Change password for Warga
export const changeWargaPassword = async (req, res) => {
  try {
    const { id_warga, currentPassword, newPassword } = req.body

    console.log("=== CHANGE WARGA PASSWORD ===")
    console.log("ID Warga:", id_warga)
    console.log("Request body:", { id_warga, currentPassword: "***", newPassword: "***" })

    // Validasi input
    if (!id_warga || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "ID Warga, password lama, dan password baru wajib diisi"
      })
    }

    // Validasi password baru
    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 4 karakter"
      })
    }

    // Cek apakah warga ada
    const [wargaRows] = await pool.query(
      "SELECT id_warga, nama_lengkap, password_custom FROM warga WHERE id_warga = ? AND status_aktif = 'Aktif'",
      [id_warga]
    )

    console.log("Query result:", wargaRows.length > 0 ? "Found" : "Not found")

    if (wargaRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Warga tidak ditemukan atau tidak aktif"
      })
    }

    const warga = wargaRows[0]
    console.log("Warga found:", { id: warga.id_warga, nama: warga.nama_lengkap })

    // Cek password lama
    // Support untuk plain text (data lama) dan MD5 hash (data baru)
    const defaultPasswordPlain = "1234"
    const defaultPasswordHash = hashPasswordMD5("1234")
    const currentPasswordDB = warga.password_custom || defaultPasswordHash
    
    // Deteksi apakah password di database dalam format MD5 (32 karakter hex) atau plain text
    const isMD5Hash = currentPasswordDB && currentPasswordDB.length === 32 && /^[a-f0-9]+$/i.test(currentPasswordDB)
    
    let isPasswordValid = false
    if (isMD5Hash) {
      // Password di database dalam bentuk MD5 hash
      const hashedCurrentPassword = hashPasswordMD5(currentPassword)
      isPasswordValid = hashedCurrentPassword === currentPasswordDB
      console.log("Password check: MD5 format")
    } else {
      // Password di database dalam bentuk plain text (data lama)
      isPasswordValid = currentPassword === currentPasswordDB
      console.log("Password check: Plain text format")
    }
    
    if (!isPasswordValid) {
      console.log("Password lama tidak sesuai")
      return res.status(401).json({
        success: false,
        message: "Password lama tidak sesuai"
      })
    }

    // Update password di kolom password_custom (simpan dalam MD5 hash untuk keamanan)
    const hashedNewPassword = hashPasswordMD5(newPassword)
    const [updateResult] = await pool.query(
      "UPDATE warga SET password_custom = ? WHERE id_warga = ?",
      [hashedNewPassword, id_warga]
    )

    console.log("Update result:", updateResult.affectedRows > 0 ? "Success" : "Failed")
    console.log("Password warga berhasil diubah untuk:", warga.nama_lengkap)

    res.json({
      success: true,
      message: "Password berhasil diubah"
    })

  } catch (error) {
    console.error("Error change warga password:", error)
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengubah password",
      error: error.message
    })
  }
}

// Change password for Petugas/Admin/SuperAdmin
export const changePetugasPassword = async (req, res) => {
  try {
    const { id_petugas, currentPassword, newPassword } = req.body

    console.log("=== CHANGE PETUGAS PASSWORD ===")
    console.log("ID Petugas:", id_petugas)
    console.log("Request body:", { id_petugas, currentPassword: "***", newPassword: "***" })

    // Validasi input
    if (!id_petugas || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "ID Petugas, password lama, dan password baru wajib diisi"
      })
    }

    // Validasi password baru
    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 4 karakter"
      })
    }

    // Ambil data petugas (termasuk admin dan superadmin)
    const [petugasRows] = await pool.query(
      `SELECT p.id_petugas, p.password, p.role, w.nama_lengkap 
       FROM petugas p
       LEFT JOIN warga w ON p.id_warga = w.id_warga
       WHERE p.id_petugas = ? AND p.status = 'Aktif'`,
      [id_petugas]
    )

    console.log("Query result:", petugasRows.length > 0 ? "Found" : "Not found")

    if (petugasRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Petugas tidak ditemukan atau tidak aktif"
      })
    }

    const petugas = petugasRows[0]
    console.log("Petugas found:", { 
      id: petugas.id_petugas, 
      role: petugas.role, 
      nama: petugas.nama_lengkap 
    })

    // Cek password lama (hash input password dan bandingkan dengan MD5 di database)
    const hashedCurrentPassword = hashPasswordMD5(currentPassword)
    if (hashedCurrentPassword !== petugas.password) {
      console.log("Password lama tidak sesuai")
      return res.status(401).json({
        success: false,
        message: "Password lama tidak sesuai"
      })
    }

    // Update password baru (simpan dalam MD5)
    const hashedNewPassword = hashPasswordMD5(newPassword)
    const [updateResult] = await pool.query(
      "UPDATE petugas SET password = ?, updated_at = NOW() WHERE id_petugas = ?",
      [hashedNewPassword, id_petugas]
    )

    console.log("Update result:", updateResult.affectedRows > 0 ? "Success" : "Failed")
    console.log("Password berhasil diubah untuk:", petugas.nama_lengkap, "- Role:", petugas.role)

    res.json({
      success: true,
      message: "Password berhasil diubah"
    })

  } catch (error) {
    console.error("Error change petugas password:", error)
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengubah password",
      error: error.message
    })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { id, role, nama, email, phone, alamat } = req.body

    console.log("=== UPDATE PROFILE ===")
    console.log("ID:", id, "Role:", role)

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: "ID dan role wajib diisi"
      })
    }

    let query = ""
    let params = []

    if (role === "warga") {
      query = `
        UPDATE warga 
        SET nama_lengkap = ?, 
            email = ?,
            alamat = ?
        WHERE id_warga = ?
      `
      params = [nama, email, alamat, id]
    } else {
      // Update untuk petugas/admin/superadmin
      query = `
        UPDATE warga w
        INNER JOIN petugas p ON w.id_warga = p.id_warga
        SET w.nama_lengkap = ?,
            w.email = ?,
            w.alamat = ?
        WHERE p.id_petugas = ?
      `
      params = [nama, email, alamat, id]
    }

    await pool.query(query, params)

    console.log("Profile berhasil diupdate untuk ID:", id)

    res.json({
      success: true,
      message: "Profile berhasil diperbarui"
    })

  } catch (error) {
    console.error("Error update profile:", error)
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengupdate profile",
      error: error.message
    })
  }
}

// backend/controllers/authController.js
import { pool } from "../config/database.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1d";

// Helper function to hash password with MD5
const hashPasswordMD5 = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

// Login function for both username and phone number
export const login = async (req, res) => {
  try {
    const { identifier, password, loginType } = req.body;

    console.log("[AUTH] Login attempt:", { identifier, loginType });

    if (!identifier || !password || !loginType) {
      return res.status(400).json({
        success: false,
        message: "Identifier, password, dan loginType wajib diisi",
      });
    }

    let user = null;
    let userQuery = "";
    let userParams = [];

    if (loginType === "phone") {
      // Login for Warga using phone number
      userQuery = `
        SELECT w.id_warga as id, w.nama_lengkap as nama, w.nomor_hp as nomorHp, 
               'warga' as role, w.status_aktif as status,
               w.nomor_hp as identifier_field, w.password_custom,
               w.email, w.alamat
        FROM warga w 
        WHERE w.nomor_hp = ? AND w.status_aktif = 'Aktif'
      `;
      userParams = [identifier];
    } else if (loginType === "username") {
      // Login for Petugas, Admin, Super Admin using username
      userQuery = `
        SELECT p.id_petugas as id, w.nama_lengkap as nama, p.username, 
               p.role, p.jabatan,
               CASE 
                 WHEN LOWER(p.role) = 'superadmin' OR LOWER(p.jabatan) LIKE '%superadmin%' OR LOWER(p.jabatan) LIKE '%super admin%' THEN 'super_admin'
                 WHEN LOWER(p.role) = 'admin' THEN 'admin' 
                 WHEN LOWER(p.role) = 'petugas' THEN 'petugas'
                 ELSE LOWER(REPLACE(p.role, ' ', '_'))
               END as user_role,
               p.status, p.password as stored_password, p.username as identifier_field,
               kr.nama_kelompok as kelompokRonda,
               w.nomor_hp as nomorHp, w.email, w.alamat
        FROM petugas p
        LEFT JOIN warga w ON p.id_warga = w.id_warga
        LEFT JOIN kelompok_ronda kr ON p.id_kelompok_ronda = kr.id_kelompok_ronda
        WHERE p.username = ? AND p.status = 'Aktif'
      `;
      userParams = [identifier];
    } else {
      return res.status(400).json({
        success: false,
        message: "LoginType harus 'phone' atau 'username'",
      });
    }

    const [rows] = await pool.query(userQuery, userParams);

    if (rows.length === 0) {
      console.log("[AUTH] User not found:", identifier);
      return res.status(401).json({
        success: false,
        message:
          loginType === "phone"
            ? "Nomor HP tidak ditemukan atau tidak aktif"
            : "Username tidak ditemukan atau tidak aktif",
      });
    }

    user = rows[0];
    console.log("[AUTH] User found:", {
      id: user.id,
      nama: user.nama,
      role_db: user.role,
      jabatan: user.jabatan,
      computed_role: user.user_role || user.role,
    });

    // Password verification
    let isPasswordValid = false;

    if (loginType === "phone") {
      // For warga, support both plain text (old data) and MD5 hash (new data)
      const defaultPasswordHash = hashPasswordMD5("1234");
      const wargaPasswordDB = user.password_custom || defaultPasswordHash;

      // Deteksi apakah password di database dalam format MD5 (32 karakter hex) atau plain text
      const isMD5Hash =
        wargaPasswordDB &&
        wargaPasswordDB.length === 32 &&
        /^[a-f0-9]+$/i.test(wargaPasswordDB);

      if (isMD5Hash) {
        // Password di database dalam bentuk MD5 hash
        const hashedInputPassword = hashPasswordMD5(password);
        isPasswordValid = hashedInputPassword === wargaPasswordDB;
        console.log("[AUTH] Warga password check: MD5 format");
      } else {
        // Password di database dalam bentuk plain text (data lama)
        isPasswordValid = password === wargaPasswordDB;
        console.log("[AUTH] Warga password check: Plain text format");
      }

      console.log("[AUTH] Warga password check:", {
        hasCustomPassword: !!user.password_custom,
        usingDefault: !user.password_custom,
        passwordMatch: isPasswordValid,
      });
    } else {
      // For petugas/admin/superadmin, hash input password and compare with stored MD5 password
      if (user.stored_password) {
        const hashedInputPassword = hashPasswordMD5(password);
        isPasswordValid = hashedInputPassword === user.stored_password;
        console.log("[AUTH] Petugas password check - MD5 comparison");
      }
    }

    if (!isPasswordValid) {
      console.log("[AUTH] Invalid password for user:", identifier);
      return res.status(401).json({
        success: false,
        message: "Password salah",
      });
    }

    // Use the computed role
    const finalRole = user.user_role || user.role;

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      nama: user.nama,
      role: finalRole,
      identifier: user.identifier_field,
    };

    if (user.kelompokRonda) {
      tokenPayload.kelompokRonda = user.kelompokRonda;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    console.log("[AUTH] Login successful for:", user.nama);

    // Determine id_warga untuk global identifier (untuk tema, dll)
    let id_warga_global = null;
    if (loginType === "phone") {
      // Untuk warga, id_warga sama dengan id
      id_warga_global = user.id;
    } else {
      // Untuk petugas/admin/superadmin, gunakan id_warga dari relasi
      const [wargaRows] = await pool.query(
        "SELECT id_warga FROM petugas WHERE id_petugas = ?",
        [user.id]
      );
      id_warga_global = wargaRows.length > 0 ? wargaRows[0].id_warga : null;
    }

    // Return user data and token
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user: {
          id: user.id.toString(),
          id_warga: id_warga_global ? id_warga_global.toString() : undefined,
          nama: user.nama,
          role: finalRole,
          username: user.username || undefined,
          nomorHp: user.nomorHp || undefined,
          email: user.email || undefined,
          alamat: user.alamat || undefined,
          kelompokRonda: user.kelompokRonda || undefined,
          isActive: true,
        },
        token,
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

// Verify JWT token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally verify user still exists and is active
    let userExists = false;
    if (decoded.role === "warga") {
      const [rows] = await pool.query(
        "SELECT id_warga FROM warga WHERE id_warga = ? AND status_aktif = 'Aktif'",
        [decoded.id]
      );
      userExists = rows.length > 0;
    } else {
      const [rows] = await pool.query(
        "SELECT id_petugas FROM petugas WHERE id_petugas = ? AND status = 'Aktif'",
        [decoded.id]
      );
      userExists = rows.length > 0;
    }

    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan atau tidak aktif",
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: decoded.id.toString(),
          nama: decoded.nama,
          role: decoded.role,
          username: decoded.username || undefined,
          nomorHp: decoded.nomorHp || undefined,
          kelompokRonda: decoded.kelompokRonda || undefined,
          isActive: true,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    res.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("[AUTH] Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat logout",
    });
  }
};

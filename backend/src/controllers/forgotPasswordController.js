// backend/controllers/forgotPasswordController.js
import { pool } from "../config/database.js";

// Helper function untuk decrypt MD5 (jika passwordnya adalah password umum)
const getPlainPassword = (md5Hash) => {
  // MD5 hash untuk password umum
  const commonPasswords = {
    '81dc9bdb52d04dc20036dbd8313ed055': '1234',
    'e10adc3949ba59abbe56e057f20f883e': '123456',
    '5f4dcc3b5aa765d61d8327deb882cf99': 'password',
    '25d55ad283aa400af464c76d713c07ad': '12345678',
    '827ccb0eea8a706c4c34a16891f84e7b': '12345',
    '21232f297a57a5a743894a0e4a801fc3': 'admin',
    '0192023a7bbd73250516f069df18b500': 'admin123',
    'e64b78fc3bc91bcbc7dc232ba8ec59e0': 'Admin123',
    '17c4520f6cfd1ab53d8745e84681eb49': 'superadmin',
  };
  
  return commonPasswords[md5Hash] || md5Hash;
};

export const getPasswordByUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: "Username/No HP wajib diisi" 
      });
    }

    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Input:', username);

    // Cek apakah input adalah nomor HP (angka saja)
    const isPhoneNumber = /^\d+$/.test(username);

    let userRows = [];
    
    if (isPhoneNumber) {
      // Cari di tabel warga berdasarkan nomor HP
      console.log('Searching by phone number in warga table...');
      [userRows] = await pool.query(
        "SELECT id_warga as id, nama_lengkap as username, nomor_hp, password_custom as password, 'Warga' as role FROM warga WHERE nomor_hp = ?",
        [username]
      );
      
      // Decode MD5 password untuk warga
      if (userRows.length > 0) {
        userRows[0].password = getPlainPassword(userRows[0].password);
      }
    } else {
      // Cari di tabel petugas berdasarkan username
      console.log('Searching by username in petugas table...');
      [userRows] = await pool.query(
        "SELECT id_petugas as id, username, password, role FROM petugas WHERE username = ?",
        [username]
      );
      
      // Decode MD5 password untuk petugas/admin/superadmin juga
      if (userRows.length > 0) {
        userRows[0].password = getPlainPassword(userRows[0].password);
      }
    }

    if (userRows.length > 0) {
      const user = userRows[0];
      console.log('User found:', { username: user.username, role: user.role });
      
      return res.json({
        success: true,
        data: {
          username: user.username,
          password: user.password,
          role: user.role
        }
      });
    }

    // Jika tidak ditemukan
    console.log('User not found');
    return res.status(404).json({
      success: false,
      message: isPhoneNumber ? "Nomor HP tidak ditemukan dalam sistem" : "Username tidak ditemukan dalam sistem"
    });

  } catch (error) {
    console.error("Error in getPasswordByUsername:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data password",
      error: error.message
    });
  }
};

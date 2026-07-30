// backend/controllers/wargaController.js
import { pool } from "../config/database.js";
import crypto from "crypto";

// Helper function to hash password with MD5
const hashPasswordMD5 = (password) => {
  return crypto.createHash("md5").update(password).digest("hex");
};

export const getAllWarga = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT w.id_warga AS id, w.nama_lengkap AS namaLengkap, w.nik, w.nomor_hp AS nomorHp,
             w.jenis_kelamin AS jenisKelaminDB, w.status_aktif AS statusAktif, 
             r.alamat AS alamatRumah, r.rt, r.rw, w.id_rumah AS idRumah
      FROM warga w LEFT JOIN rumah r ON w.id_rumah = r.id_rumah
      ORDER BY w.id_warga DESC
    `);

    // Mapping jenis kelamin dari database ke frontend
    const mappedRows = rows.map((row) => ({
      ...row,
      jenisKelamin:
        row.jenisKelaminDB === "L"
          ? "Laki-laki"
          : row.jenisKelaminDB === "P"
          ? "Perempuan"
          : row.jenisKelaminDB,
      jenisKelaminDB: undefined, // Remove the temporary field
    }));

    res.json({ success: true, data: mappedRows });
  } catch (error) {
    console.error("Error getting all warga:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data warga",
      error: error.message,
    });
  }
};

// Get only kepala keluarga (head of family)
export const getKepalaKeluarga = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT
        w.id_warga AS id, 
        w.nama_lengkap AS namaLengkap, 
        w.nik, 
        w.nomor_hp AS nomorHp,
        w.jenis_kelamin AS jenisKelaminDB, 
        w.status_aktif AS statusAktif, 
        r.id_rumah AS idRumah,
        r.alamat AS alamatRumah, 
        r.rt, 
        r.rw,
        r.id_kepala_keluarga
      FROM rumah r
      LEFT JOIN warga w ON r.id_kepala_keluarga = w.id_warga
      WHERE r.id_kepala_keluarga IS NOT NULL 
        AND w.id_warga IS NOT NULL
        AND w.status_aktif = 'Aktif'
      ORDER BY w.nama_lengkap ASC
    `);

    // Mapping jenis kelamin dari database ke frontend
    const mappedRows = rows.map((row) => ({
      ...row,
      jenisKelamin:
        row.jenisKelaminDB === "L"
          ? "Laki-laki"
          : row.jenisKelaminDB === "P"
          ? "Perempuan"
          : row.jenisKelaminDB,
      jenisKelaminDB: undefined, // Remove the temporary field
    }));

    res.json({ success: true, data: mappedRows });
  } catch (error) {
    console.error("Error getting kepala keluarga:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data kepala keluarga",
      error: error.message,
    });
  }
};

export const getWargaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `
      SELECT w.id_warga AS id, w.nama_lengkap AS namaLengkap, w.nik, w.nomor_hp AS nomorHp,
             w.jenis_kelamin AS jenisKelaminDB, w.status_aktif AS statusAktif, 
             w.id_rumah AS idRumah, r.alamat AS alamatRumah
      FROM warga w LEFT JOIN rumah r ON w.id_rumah = r.id_rumah WHERE w.id_warga = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data warga tidak ditemukan" });
    }

    // Mapping jenis kelamin dari database ke frontend
    const warga = rows[0];
    warga.jenisKelamin =
      warga.jenisKelaminDB === "L"
        ? "Laki-laki"
        : warga.jenisKelaminDB === "P"
        ? "Perempuan"
        : warga.jenisKelaminDB;
    delete warga.jenisKelaminDB; // Remove temporary field

    res.json({ success: true, data: warga });
  } catch (error) {
    console.error("Error getting warga by id:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil warga",
      error: error.message,
    });
  }
};

export const createWarga = async (req, res) => {
  try {
    const { idRumah, namaLengkap, nik, nomorHp, jenisKelamin, statusAktif } =
      req.body;

    // Debug logging
    console.log("DEBUG CREATE WARGA - Data received:", {
      idRumah,
      namaLengkap,
      nik,
      nomorHp,
      jenisKelamin,
      statusAktif,
    });
    console.log("DEBUG CREATE WARGA - jenisKelamin value:", jenisKelamin);
    console.log("DEBUG CREATE WARGA - jenisKelamin type:", typeof jenisKelamin);

    // Validasi yang lebih ketat
    if (!namaLengkap || namaLengkap.trim() === "") {
      console.log(
        "DEBUG CREATE WARGA - namaLengkap validation failed:",
        namaLengkap
      );
      return res.status(400).json({
        success: false,
        message: "Nama lengkap wajib diisi dan tidak boleh kosong",
      });
    }

    if (!jenisKelamin || jenisKelamin.trim() === "") {
      console.log(
        "DEBUG CREATE WARGA - jenisKelamin validation failed:",
        jenisKelamin
      );
      return res.status(400).json({
        success: false,
        message: "Jenis kelamin wajib dipilih",
      });
    }

    // Mapping jenis kelamin dari frontend ke database
    // Frontend: "Laki-laki" / "Perempuan" -> Database: "L" / "P"
    // let jenisKelaminDB;
    // if (jenisKelamin === "Laki-laki") {
    //   jenisKelaminDB = "L";
    // } else if (jenisKelamin === "Perempuan") {
    //   jenisKelaminDB = "P";
    // } else {
    //   console.log("DEBUG CREATE WARGA - Invalid jenisKelamin value:", jenisKelamin);
    //   return res.status(400).json({
    //     success: false,
    //     message: "Jenis kelamin harus 'Laki-laki' atau 'Perempuan'"
    //   });
    // }

    // console.log(
    //   "DEBUG CREATE WARGA - jenisKelamin mapped to DB:",
    //   jenisKelaminDB
    // );

    // Set password default untuk warga baru (hash dengan MD5)
    const defaultPassword = "1234";
    const hashedPassword = hashPasswordMD5(defaultPassword);

    const [result] = await pool.query(
      "INSERT INTO warga (id_rumah, nama_lengkap, nik, nomor_hp, jenis_kelamin, status_aktif, password_custom) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        idRumah || null,
        namaLengkap.trim(),
        nik || null,
        nomorHp || null,
        jenisKelamin,
        statusAktif || "Aktif",
        hashedPassword,
      ]
    );

    console.log("DEBUG CREATE WARGA - Insert result:", result);

    res.status(201).json({
      success: true,
      message: "Data warga berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("DEBUG CREATE WARGA - Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan warga",
      error: error.message,
    });
  }
};

export const updateWarga = async (req, res) => {
  try {
    const { id } = req.params;
    const { idRumah, namaLengkap, nik, nomorHp, jenisKelamin, statusAktif } =
      req.body;

    // Mapping jenis kelamin dari frontend ke database
    // let jenisKelaminDB;
    // if (jenisKelamin === "Laki-laki") {
    //   jenisKelaminDB = "L";
    // } else if (jenisKelamin === "Perempuan") {
    //   jenisKelaminDB = "P";
    // } else {
    //   // Fallback jika nilai tidak sesuai
    //   jenisKelaminDB =
    //     jenisKelamin === "L" || jenisKelamin === "P" ? jenisKelamin : "L";
    // }

    const [result] = await pool.query(
      "UPDATE warga SET id_rumah = ?, nama_lengkap = ?, nik = ?, nomor_hp = ?, jenis_kelamin = ?, status_aktif = ?, updated_at = NOW() WHERE id_warga = ?",
      [
        idRumah || null,
        namaLengkap,
        nik || null,
        nomorHp || null,
        jenisKelamin,
        statusAktif || "Aktif",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data warga tidak ditemukan" });
    }

    res.json({ success: true, message: "Data warga berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating warga:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui warga",
      error: error.message,
    });
  }
};

export const deleteWarga = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM warga WHERE id_warga = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Data warga tidak ditemukan" });
    res.json({ success: true, message: "Data warga berhasil dihapus" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus warga",
      error: error.message,
    });
  }
};

// Get warga by barcode (kepala keluarga dari rumah dengan barcode tertentu)
export const getWargaByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    console.log("DEBUG BARCODE - Received barcode:", barcode);

    // Query untuk mendapatkan kepala keluarga berdasarkan barcode rumah
    const [rows] = await pool.query(
      `
      SELECT 
        w.id_warga AS id, 
        w.nama_lengkap AS namaLengkap, 
        w.nik, 
        w.nomor_hp AS nomorHp,
        w.jenis_kelamin AS jenisKelaminDB, 
        w.status_aktif AS statusAktif, 
        r.id_rumah AS idRumah,
        r.alamat AS alamatRumah, 
        r.rt, 
        r.rw,
        r.kode_barcode AS kodeBarcode
      FROM rumah r
      LEFT JOIN warga w ON r.id_kepala_keluarga = w.id_warga
      WHERE r.kode_barcode = ? 
        AND r.id_kepala_keluarga IS NOT NULL 
        AND w.id_warga IS NOT NULL
      LIMIT 1
    `,
      [barcode]
    );

    console.log("DEBUG BARCODE - Query result rows:", rows.length);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rumah atau kepala keluarga tidak ditemukan untuk barcode ini",
      });
    }

    // Mapping jenis kelamin dari database ke frontend
    const warga = rows[0];
    warga.jenisKelamin =
      warga.jenisKelaminDB === "L"
        ? "Laki-laki"
        : warga.jenisKelaminDB === "P"
        ? "Perempuan"
        : warga.jenisKelaminDB;
    delete warga.jenisKelaminDB;

    console.log("DEBUG BARCODE - Returning warga:", warga.namaLengkap);

    res.json({ success: true, data: warga });
  } catch (error) {
    console.error("Error getting warga by barcode:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data warga berdasarkan barcode",
      error: error.message,
    });
  }
};

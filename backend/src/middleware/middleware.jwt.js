import { pool } from "../config/database.js";
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      status: "error",
      code: 401,
      message: "Unauthorized",
    });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        error: err,
      });
    }

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

    req.user = decoded;

    next();
  });
};

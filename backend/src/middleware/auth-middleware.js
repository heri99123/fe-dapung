import jwt from "jsonwebtoken"
import { pool } from "../config/database.js";

export const authMiddleware = async (req, res, next) => {
    const token = req.get("Authorization");

    if (!token) {
        res
            .status(401)
            .json({
                errors: "Unauthorized",
            })
            .end();
    } else {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                res.status(401).json({
                    errors: err,
                }).end();
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
                res.status(401).json({
                    errors: "User tidak ditemukan atau tidak aktif",
                }).end();
            }

            req.user = decoded;

            next();
        });
    }
}

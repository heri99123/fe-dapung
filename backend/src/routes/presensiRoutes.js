import express from "express";
import {
  getAllPresensi,
  getPresensiById,
  createPresensi,
  updatePresensi,
  deletePresensi,
  getPresensiKemarinMalam,
  getPresensiByDate,
  getPresensiByMonth,
} from "../controllers/presensiController.js";

const router = express.Router();

router.get("/", getAllPresensi);
router.get("/kemarin-malam", getPresensiKemarinMalam);
router.get("/by-date", getPresensiByDate);
router.get("/by-month", getPresensiByMonth);
router.get("/:id", getPresensiById);
router.post("/", createPresensi);
router.put("/:id", updatePresensi);
router.delete("/:id", deletePresensi);

export default router;

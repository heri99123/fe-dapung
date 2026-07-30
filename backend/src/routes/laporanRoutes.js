import express from "express";
import {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  updateLaporan,
  deleteLaporan,
} from "../controllers/laporanController.js";

const router = express.Router();

router.get("/", getAllLaporan);
router.get("/:id", getLaporanById);
router.post("/", createLaporan);
router.put("/:id", updateLaporan);
router.delete("/:id", deleteLaporan);

export default router;

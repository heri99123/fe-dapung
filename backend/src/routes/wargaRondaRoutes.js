// backend/routes/wargaRondaRoutes.js
import express from "express"
import { getKelompokRondaInfo, getPartisipasiKelompok } from "../controllers/wargaRondaController.js"

const router = express.Router()

// Route untuk mendapatkan informasi kelompok ronda (hari ini & kemarin)
router.get("/info", getKelompokRondaInfo)

// Route untuk mendapatkan detail partisipasi berdasarkan tanggal
router.get("/partisipasi/:tanggal", getPartisipasiKelompok)

export default router
import express from "express"
import {
  getAllKelompokRonda,
  getKelompokRondaById,
  createKelompokRonda,
  updateKelompokRonda,
  deleteKelompokRonda,
  getAnggotaByKelompokId,
} from "../controllers/kelompokRondaController.js"

const router = express.Router()

router.get("/", getAllKelompokRonda)
router.get("/:id", getKelompokRondaById)
router.get("/:id/anggota", getAnggotaByKelompokId)
router.post("/", createKelompokRonda)
router.put("/:id", updateKelompokRonda)
router.delete("/:id", deleteKelompokRonda)

export default router

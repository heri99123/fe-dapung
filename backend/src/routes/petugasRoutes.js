import express from "express";
import {
  getAllPetugas,
  getPetugasById,
  createPetugas,
  updatePetugas,
  deletePetugas,
  checkPetugasScheduleToday,
} from "../controllers/petugasController.js";

const router = express.Router();

router.get("/", getAllPetugas);
// Route spesifik harus didefinisikan SEBELUM route dengan parameter :id
router.get("/:id/check-schedule", checkPetugasScheduleToday);
router.get("/:id", getPetugasById);
router.post("/", createPetugas);
router.put("/:id", updatePetugas);
router.delete("/:id", deletePetugas);

export default router;

import express from "express";
import {
  getAllRumah,
  getRumahById,
  createRumah,
  updateRumah,
  deleteRumah
} from "../controllers/rumahController.js";

const router = express.Router();

router.get("/", getAllRumah);
router.get("/:id", getRumahById); // detail + penghuni
router.post("/", createRumah);
router.put("/:id", updateRumah);
router.delete("/:id", deleteRumah);

export default router;

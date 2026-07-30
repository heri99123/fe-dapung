import express from "express"
import {
  getAllJenisDana,
  getJenisDanaById,
  createJenisDana,
  updateJenisDana,
  deleteJenisDana,
} from "../controllers/jenisDanaController.js"

const router = express.Router()

router.get("/", getAllJenisDana)
router.get("/:id", getJenisDanaById)
router.post("/", createJenisDana)
router.put("/:id", updateJenisDana)
router.delete("/:id", deleteJenisDana)

export default router
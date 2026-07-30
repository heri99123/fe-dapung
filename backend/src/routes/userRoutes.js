// backend/routes/userRoutes.js
import express from "express"
import { changeWargaPassword, changePetugasPassword, updateProfile } from "../controllers/userController.js"

const router = express.Router()

// Change password routes
router.post("/warga/change-password", changeWargaPassword)
router.post("/petugas/change-password", changePetugasPassword)

// Update profile
router.put("/profile", updateProfile)

export default router

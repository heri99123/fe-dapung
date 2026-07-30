// backend/routes/authRoutes.js
import express from "express"
import { login, verifyToken, logout } from "../controllers/authController.js"

const router = express.Router()

// Public routes
router.post("/login", login)
router.post("/verify-token", verifyToken)
router.post("/logout", logout)

export default router
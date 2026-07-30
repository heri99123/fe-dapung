// backend/routes/forgotPasswordRoutes.js
import express from "express";
import { getPasswordByUsername } from "../controllers/forgotPasswordController.js";

const router = express.Router();

// POST /api/forgot-password
router.post("/", getPasswordByUsername);

export default router;

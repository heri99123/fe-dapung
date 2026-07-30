import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { authenticate } from "./middleware/middleware.jwt.js";

// ✅ Import semua routes
import authRoutes from "./routes/authRoutes.js";
import petugasRoutes from "./routes/petugasRoutes.js";
import wargaRoutes from "./routes/wargaRoutes.js";
import rumahRoutes from "./routes/rumahRoutes.js";
import kelompokRondaRoutes from "./routes/kelompokRondaRoutes.js";
import jenisDanaRoutes from "./routes/jenisDanaRoutes.js";
import transaksiRoutes from "./routes/transaksiRoutes.js";
import presensiRoutes from "./routes/presensiRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import wargaRondaRoutes from "./routes/wargaRondaRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import logger from "./config/logger.js";
import { errorMiddleware } from "./middleware/error-middleware.js";
import { pinoHttp } from "pino-http";
import {testConnection} from "./config/database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;

// logger
app.use(pinoHttp({logger}))

// CORS configuration
app.use(
  cors({
    origin: '*',
    credentials: process.env.NODE_ENV == "production" ? true : false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/petugas", authenticate, petugasRoutes);
app.use("/api/warga", authenticate, wargaRoutes);
app.use("/api/rumah", authenticate, rumahRoutes);
app.use("/api/kelompok-ronda", authenticate, kelompokRondaRoutes);
app.use("/api/jenis-dana", authenticate, jenisDanaRoutes);
app.use("/api/transaksi", authenticate, transaksiRoutes);
app.use("/api/presensi", authenticate, presensiRoutes);
app.use("/api/laporan", authenticate, laporanRoutes);
app.use("/api/warga-ronda", authenticate, wargaRondaRoutes);
app.use("/api/user", authenticate, userRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);

// ✅ Default API root info
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Jimpitan API",
  });
});

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Error handling middleware
app.use(errorMiddleware)
// app.use((err, req, res, next) => {
//   console.error("[Server Error]:", err);
//   res.status(500).json({
//     success: false,
//     message: "Internal server error",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    errors: "Route not found",
  });
});

// ✅ Jalankan koneksi database & server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      testConnection();
      console.log("APP runing")
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();

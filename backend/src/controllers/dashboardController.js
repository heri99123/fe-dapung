import { pool } from "../config/database.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log("[DASHBOARD] Fetching dashboard statistics")

    // Get total warga aktif
    const [wargaRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM warga 
      WHERE status_aktif = 'Aktif'
    `)
    const totalWarga = wargaRows[0].total

    // Get total rumah
    const [rumahRows] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM rumah
    `)
    const totalRumah = rumahRows[0].total

    // Get dana hari ini - gunakan nominal dari tanggal_setor
    const today = new Date().toISOString().split('T')[0]
    
    const [danaHariIniRows] = await pool.query(`
      SELECT COALESCE(SUM(nominal), 0) as total 
      FROM transaksi 
      WHERE DATE(tanggal_setor) = ?
    `, [today])
    const totalDanaHariIni = parseFloat(danaHariIniRows[0].total) || 0

    // Get dana bulan ini - gunakan nominal dari tanggal_setor
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const [danaBulanIniRows] = await pool.query(`
      SELECT COALESCE(SUM(nominal), 0) as total 
      FROM transaksi 
      WHERE MONTH(tanggal_setor) = ? 
      AND YEAR(tanggal_setor) = ?
    `, [currentMonth, currentYear])
    const totalDanaBulanIni = parseFloat(danaBulanIniRows[0].total) || 0

    // Get statistik pembayaran bulan ini
    // Hitung berapa warga yang sudah bayar bulan ini berdasarkan transaksi
    const [wargaBayarRows] = await pool.query(`
      SELECT COUNT(DISTINCT id_warga) as total
      FROM transaksi
      WHERE MONTH(tanggal_setor) = ? 
      AND YEAR(tanggal_setor) = ?
      AND id_warga IS NOT NULL
    `, [currentMonth, currentYear])
    const wargaSudahBayar = wargaBayarRows[0].total

    // Hitung persentase
    const persenSudahBayar = totalWarga > 0 ? Math.round((wargaSudahBayar / totalWarga) * 100) : 0
    const persenBelumBayar = 100 - persenSudahBayar

    // Get transaksi hari ini
    const [transaksiHariIniRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM transaksi
      WHERE DATE(tanggal_setor) = ?
    `, [today])
    const transaksiHariIni = transaksiHariIniRows[0].total

    console.log("[DASHBOARD] Stats:", {
      totalWarga,
      totalRumah,
      totalDanaHariIni,
      totalDanaBulanIni,
      wargaSudahBayar,
      persenSudahBayar,
      persenBelumBayar,
      transaksiHariIni
    })

    res.json({
      success: true,
      data: {
        totalWarga,
        totalRumah,
        totalDanaHariIni,
        totalDanaBulanIni,
        statistikPembayaran: {
          sudahBayar: wargaSudahBayar,
          belumBayar: totalWarga - wargaSudahBayar,
          persenSudahBayar,
          persenBelumBayar
        },
        transaksiHariIni
      }
    })

  } catch (error) {
    console.error("[DASHBOARD] Error:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik dashboard",
      error: error.message
    })
  }
}

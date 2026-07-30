// backend/controllers/wargaRondaController.js
import { pool } from "../config/database.js"

// Helper function untuk mengecek apakah kelompok ronda sesuai jadwal hari tertentu
function isScheduledForDate(jadwalHari, targetDate) {
  if (!jadwalHari) return false;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDay = days[targetDate.getDay()];
  const schedule = jadwalHari.toLowerCase();
  const targetDayLower = targetDay.toLowerCase();
  
  // Handle different schedule formats
  if (schedule.includes(' - ')) {
    // Format: "Senin - Rabu" atau "Kamis - Sabtu"
    const [startDay, endDay] = schedule.split(' - ').map(day => day.trim());
    
    const dayOrder = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const targetIndex = dayOrder.indexOf(targetDayLower);
    const startIndex = dayOrder.indexOf(startDay.toLowerCase());
    const endIndex = dayOrder.indexOf(endDay.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    // Handle wrap-around schedules (e.g., Sabtu - Senin)
    if (startIndex <= endIndex) {
      return targetIndex >= startIndex && targetIndex <= endIndex;
    } else {
      return targetIndex >= startIndex || targetIndex <= endIndex;
    }
  } else {
    // Single day format: "Sabtu", "Minggu", etc.
    return schedule === targetDayLower;
  }
}

// Get informasi kelompok ronda hari ini dan kemarin untuk warga
export const getKelompokRondaInfo = async (req, res) => {
  try {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    console.log('=== DEBUG WARGA RONDA INFO ===')
    console.log('Today date:', todayStr)
    console.log('Yesterday date:', yesterdayStr)

    // Helper function untuk mendapatkan kelompok yang terjadwal (baik sudah ada absensi atau belum)
    const getGroupsWithAbsensi = async (dateStr, targetDate) => {
      // Ambil semua kelompok ronda beserta data absensi TERBARU per petugas
      const [groups] = await pool.query(`
        SELECT 
          kr.id_kelompok_ronda AS id,
          kr.nama_kelompok AS namaKelompok,
          kr.jadwal_hari AS jadwalHari,
          COUNT(DISTINCT p.id_petugas) AS totalAnggota,
          COUNT(DISTINCT CASE WHEN LOWER(latest_pr.status) = 'hadir' THEN latest_pr.id_warga END) AS hadirCount,
          COUNT(DISTINCT CASE WHEN LOWER(latest_pr.status) = 'izin' THEN latest_pr.id_warga END) AS izinCount,
          COUNT(DISTINCT CASE WHEN LOWER(latest_pr.status) = 'sakit' THEN latest_pr.id_warga END) AS sakitCount,
          COUNT(DISTINCT CASE WHEN LOWER(latest_pr.status) IN ('alpha', 'tidak hadir') THEN latest_pr.id_warga END) AS alphaCount
        FROM kelompok_ronda kr
        LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
        LEFT JOIN (
          SELECT pr1.*
          FROM presensi pr1
          INNER JOIN (
            SELECT id_warga, MAX(created_at) as max_created
            FROM presensi
            WHERE DATE(tanggal) = ?
            GROUP BY id_warga
          ) pr2 ON pr1.id_warga = pr2.id_warga AND pr1.created_at = pr2.max_created
          WHERE DATE(pr1.tanggal) = ?
        ) latest_pr ON p.id_warga = latest_pr.id_warga
        GROUP BY kr.id_kelompok_ronda, kr.nama_kelompok, kr.jadwal_hari
        ORDER BY kr.nama_kelompok
      `, [dateStr, dateStr])
      
      // Filter hanya kelompok yang sesuai jadwal hari ini/kemarin
      const filteredGroups = groups.filter(group => isScheduledForDate(group.jadwalHari, targetDate))
      
      console.log(`=== Groups scheduled for ${dateStr} ===`)
      filteredGroups.forEach(g => {
        console.log(`${g.namaKelompok}: Total=${g.totalAnggota}, Hadir=${g.hadirCount}, Izin=${g.izinCount}, Sakit=${g.sakitCount}, Alpha=${g.alphaCount}`)
      })
      
      return filteredGroups
    }

    // Helper function untuk mendapatkan detail anggota (baik sudah ada absensi atau belum)
    // Hanya ambil data absensi TERBARU per petugas per hari
    const getGroupMembers = async (dateStr) => {
      const [members] = await pool.query(`
        SELECT DISTINCT
          kr.id_kelompok_ronda AS kelompokId,
          kr.nama_kelompok AS namaKelompok,
          w.nama_lengkap AS namaLengkap,
          p.jabatan,
          latest_pr.status AS status,
          DATE_FORMAT(latest_pr.check_in, '%Y-%m-%d %H:%i:%s') AS check_in,
          DATE_FORMAT(latest_pr.check_out, '%Y-%m-%d %H:%i:%s') AS check_out,
          latest_pr.keterangan,
          p.id_warga
        FROM kelompok_ronda kr
        INNER JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
        INNER JOIN warga w ON p.id_warga = w.id_warga
        INNER JOIN (
          SELECT 
            pr1.id_warga,
            pr1.status,
            pr1.tanggal,
            pr1.check_in,
            pr1.check_out,
            pr1.keterangan,
            pr1.created_at
          FROM presensi pr1
          INNER JOIN (
            SELECT id_warga, MAX(created_at) as max_created
            FROM presensi
            WHERE DATE(tanggal) = ?
            GROUP BY id_warga
          ) pr2 ON pr1.id_warga = pr2.id_warga 
               AND pr1.created_at = pr2.max_created
               AND DATE(pr1.tanggal) = ?
        ) latest_pr ON p.id_warga = latest_pr.id_warga
        ORDER BY kr.nama_kelompok, w.nama_lengkap
      `, [dateStr, dateStr])
      
      console.log(`=== Members for ${dateStr} ===`)
      console.log('Total members fetched:', members.length)
      console.log('Members with all statuses:')
      members.forEach(m => {
        console.log(`  - ${m.namaLengkap}: status="${m.status}" (${typeof m.status}), kelompok=${m.namaKelompok}`)
      })
      
      return members
    }

    // Ambil data absensi untuk hari ini dan kemarin
    const [todayGroups, yesterdayGroups, todayMembers, yesterdayMembers] = await Promise.all([
      getGroupsWithAbsensi(todayStr, today),
      getGroupsWithAbsensi(yesterdayStr, yesterday),
      getGroupMembers(todayStr),
      getGroupMembers(yesterdayStr)
    ])

    console.log('Today groups with absensi:', todayGroups)
    console.log('Today members with absensi:', todayMembers.length, 'records')
    console.log('Yesterday groups with absensi:', yesterdayGroups)
    console.log('Yesterday members with absensi:', yesterdayMembers.length, 'records')

    // Log detail status untuk debugging
    console.log('\n=== TODAY MEMBERS DETAIL ===')
    todayMembers.forEach(m => {
      console.log(`${m.namaLengkap}: "${m.status}" (kelompok: ${m.namaKelompok})`)
    })

    // Filter members hanya untuk kelompok yang terjadwal
    const todayGroupIds = todayGroups.map(g => g.id)
    const yesterdayGroupIds = yesterdayGroups.map(g => g.id)
    
    const filteredTodayMembers = todayMembers.filter(m => todayGroupIds.includes(m.kelompokId))
    const filteredYesterdayMembers = yesterdayMembers.filter(m => yesterdayGroupIds.includes(m.kelompokId))

    console.log('\n=== AFTER FILTERING BY SCHEDULED GROUPS ===')
    console.log(`Today: ${filteredTodayMembers.length} members (from ${todayMembers.length} total)`)
    console.log(`Yesterday: ${filteredYesterdayMembers.length} members (from ${yesterdayMembers.length} total)`)
    
    filteredTodayMembers.forEach(m => {
      console.log(`  ✓ ${m.namaLengkap}: "${m.status}"`)
    })

    res.json({
      success: true,
      data: {
        today: {
          date: todayStr,
          groups: todayGroups,
          members: filteredTodayMembers
        },
        yesterday: {
          date: yesterdayStr,
          groups: yesterdayGroups,
          members: filteredYesterdayMembers
        }
      }
    })
  } catch (error) {
    console.error("Error fetching kelompok ronda info:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil informasi kelompok ronda",
      error: error.message,
    })
  }
}

// Get detail partisipasi kelompok ronda berdasarkan tanggal
export const getPartisipasiKelompok = async (req, res) => {
  try {
    const { tanggal } = req.params
    
    if (!tanggal) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal wajib diisi"
      })
    }

    const [members] = await pool.query(`
      SELECT 
        kr.id_kelompok_ronda AS kelompokId,
        kr.nama_kelompok AS namaKelompok,
        w.nama_lengkap AS namaLengkap,
        p.jabatan,
        latest_pr.status AS status,
        DATE_FORMAT(latest_pr.check_in, '%Y-%m-%d %H:%i:%s') AS check_in,
        DATE_FORMAT(latest_pr.check_out, '%Y-%m-%d %H:%i:%s') AS check_out,
        latest_pr.keterangan
      FROM kelompok_ronda kr
      LEFT JOIN petugas p ON kr.id_kelompok_ronda = p.id_kelompok_ronda AND p.status = 'Aktif'
      LEFT JOIN warga w ON p.id_warga = w.id_warga
      LEFT JOIN (
        SELECT pr1.*
        FROM presensi pr1
        INNER JOIN (
          SELECT id_warga, MAX(created_at) as max_created
          FROM presensi
          WHERE DATE(tanggal) = ?
          GROUP BY id_warga
        ) pr2 ON pr1.id_warga = pr2.id_warga AND pr1.created_at = pr2.max_created
        WHERE DATE(pr1.tanggal) = ?
      ) latest_pr ON p.id_warga = latest_pr.id_warga
      WHERE w.nama_lengkap IS NOT NULL
      ORDER BY kr.nama_kelompok, w.nama_lengkap
    `, [tanggal, tanggal])

    // Group by kelompok
    const groupedData = members.reduce((acc, member) => {
      const { kelompokId, namaKelompok, ...memberData } = member
      
      if (!acc[kelompokId]) {
        acc[kelompokId] = {
          id: kelompokId,
          namaKelompok,
          members: []
        }
      }
      
      acc[kelompokId].members.push(memberData)
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        tanggal,
        kelompok: Object.values(groupedData)
      }
    })
  } catch (error) {
    console.error("Error fetching partisipasi kelompok:", error)
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data partisipasi",
      error: error.message,
    })
  }
}
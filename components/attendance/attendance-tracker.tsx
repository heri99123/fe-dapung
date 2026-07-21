"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, UserCheck, Calendar } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  type AttendanceSession,
  mockPresensi,
} from "@/lib/attendance"
import { getTodayDayName, isScheduledToday, formatScheduleDisplay } from "@/lib/schedule-utils"
import type { Presensi, User, Petugas } from "@/types/database"
import { apiClient } from "@/lib/api"


interface AttendanceTrackerProps {
  user: User
}

export function AttendanceTracker({ user }: AttendanceTrackerProps) {
  const { toast } = useToast()
  const [todayAttendance, setTodayAttendance] = useState<Presensi | null>(null)
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasScheduleToday, setHasScheduleToday] = useState(false)
  const [scheduleInfo, setScheduleInfo] = useState<{
    todayName: string
    jadwalHari?: string
    namaKelompok?: string
  }>({ todayName: '' })

  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [presensi, setPresensi] = useState<Presensi[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, "hadir" | "izin" | "sakit" | "alpha">>({})
  const [checkInTimes, setCheckInTimes] = useState<Record<string, Date>>({})
  const [isEditMode, setIsEditMode] = useState(false)

  async function getAllPetugas(): Promise<Petugas[]> {
    const data = await apiClient.get("/petugas").then((response) => response.data) as any[]
    console.log(
      "🔍 RAW DATA FROM API:",
      data.filter((d) => ["Superadmin1", "Admin13"].includes(d.username))
    );
    return data.map((item) => {
      const mapped = {
        id: item.id || item.id_petugas,
        id_warga: item.id_warga, // Simpan id_warga untuk keperluan presensi
        kelompokId: item.kelompokId || item.id_kelompok_ronda, // Tambahkan kelompokId
        namaLengkap: item.namaWarga || item.nama_lengkap || "",
        nik: item.nik || "",
        namaKelompok: item.namaKelompok || "",
        jadwalHari: item.jadwalHari || "", // Tambahkan jadwalHari
        jabatan: item.jabatan || "",
        role: item.role, // HAPUS FALLBACK - gunakan langsung dari backend
        status: item.status || "Tidak Aktif",
        username: item.username || "",
        createdAt: new Date(item.created_at || new Date()),
        updatedAt: new Date(item.updated_at || new Date()),
      };
      if (["Superadmin1", "Admin13"].includes(item.username)) {
        console.log(`🔍 MAPPED ${item.username}:`, {
          original_role: item.role,
          mapped_role: mapped.role,
        });
      }
      return mapped;
    });
  }

 async function getPresensiByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Presensi[]> {
    console.log(
      `getPresensiByDateRange: startDate=${startDate}, endDate=${endDate}`
    );
    return await apiClient.get(
      `/presensi?startDate=${startDate}&endDate=${endDate}`
    ).then((response) => response.data) as Presensi[]
  }

  const getTodayAttendance = async (id_user: string): Promise<Presensi | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
  
    const today = new Date()
    today.setHours(0, 0, 0, 0)
  
    const attendance = mockPresensi.find((p) => {
      const attendanceDate = new Date(p.tanggal)
      attendanceDate.setHours(0, 0, 0, 0)
      return p.id_user === id_user && attendanceDate.getTime() === today.getTime()
    })
  
    return attendance || null
  }

  const checkInAttendance = async (id_user: string): Promise<Presensi> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    const today = new Date();
    const existingAttendance = await getTodayAttendance(id_user);
  
    if (existingAttendance) {
      throw new Error("Anda sudah melakukan check-in hari ini");
    }
  
    const newAttendance: Presensi = {
      id: (mockPresensi.length + 1).toString(),
      id_user,
      check_in: new Date(),
      check_out: null,
      tanggal: today,
      status: "hadir",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  
    mockPresensi.push(newAttendance);
    return newAttendance;
  };

   const checkOutAttendance = async (
    id_user: string
  ): Promise<Presensi> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const todayAttendance = await getTodayAttendance(id_user);

    if (!todayAttendance) {
      throw new Error("Anda belum melakukan check-in hari ini");
    }

    if (todayAttendance.check_out) {
      throw new Error("Anda sudah melakukan check-out hari ini");
    }

    const index = mockPresensi.findIndex((p) => p.id === todayAttendance.id);
    if (index !== -1) {
      mockPresensi[index] = {
        ...mockPresensi[index],
        check_out: new Date(),
        updatedAt: new Date(),
      };
      return mockPresensi[index];
    }

    throw new Error("Gagal melakukan check-out");
  };

  const getCurrentSession =
    async (): Promise<AttendanceSession | null> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
  
      const today = new Date();
      const currentHour = today.getHours();
  
      // Define session times (21:00 - 04:00 next day)
      const isActiveSession = currentHour >= 21 || currentHour < 4;
  
      if (!isActiveSession) {
        return null;
      }
  
      const todayAttendance = mockPresensi.filter((p) => {
        const attendanceDate = new Date(p.tanggal);
        attendanceDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return attendanceDate.getTime() === todayDate.getTime();
      });
  
      return {
        id: "session-1",
        tanggal: today,
        startTime: "21:00",
        endTime: "04:00",
        isActive: true,
        totalPetugas: 10, // Mock total officers (will be overridden in component)
        hadirCount: todayAttendance.filter((p) => p.status === "hadir").length,
      };
    };

    const mapStatusToBackend = (
      status: "hadir" | "izin" | "sakit" | "alpha"
    ): string => {
      const statusMap = {
        hadir: "Hadir",
        izin: "Izin",
        sakit: "Sakit", // Sekarang sudah ada di ENUM
        alpha: "Alpha", // Sekarang sudah ada di ENUM
      };
      console.log(`Status mapping: ${status} -> ${statusMap[status]}`);
      return statusMap[status] || "Hadir";
    };

    async function updatePresensi(
      id: string,
      data: any
    ): Promise<Presensi | any> {
      // Helper function to convert Date to MySQL DATETIME format in Indonesia timezone
      const toMySQLDateTime = (date: Date | null | undefined): string | null => {
        if (!date) return null;
    
        // Pastikan date adalah Date object
        const dateObj = date instanceof Date ? date : new Date(date);
    
        // Format sebagai YYYY-MM-DD HH:mm:ss menggunakan waktu lokal browser
        // Browser user di Indonesia akan otomatis menggunakan GMT+7
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
    
      // Convert frontend data format to backend format
      const backendData = {
        id_warga: data.id_warga || data.id_user, // Backend expects id_warga
        tanggal: data.tanggal, // Should be in YYYY-MM-DD format
        check_in: toMySQLDateTime(data.check_in),
        check_out: toMySQLDateTime(data.check_out),
        status: data.status,
      };
    
      return apiClient.put(`/presensi/${id}`, backendData);
    }

     async function getTodayPresensi(): Promise<Presensi[]> {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
    
      // Format tanggal ke YYYY-MM-DD untuk backend
      const todayStr = today.toISOString().split("T")[0];
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
      console.log(
        `getTodayPresensi: startDate=${todayStr}, endDate=${tomorrowStr}`
      );
    
      return await apiClient.get(
        `/presensi?startDate=${todayStr}&endDate=${tomorrowStr}`
      ).then((response) => response.data) as Presensi[]
    }

    async function createPresensi(data: any): Promise<Presensi | any> {
      // Helper function to convert Date to MySQL DATETIME format in Indonesia timezone
      const toMySQLDateTime = (date: Date | null | undefined): string | null => {
        if (!date) return null;
    
        // Pastikan date adalah Date object
        const dateObj = date instanceof Date ? date : new Date(date);
    
        // Format sebagai YYYY-MM-DD HH:mm:ss menggunakan waktu lokal browser
        // Browser user di Indonesia akan otomatis menggunakan GMT+7
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
    
      // Convert frontend data format to backend format
      const backendData = {
        id_warga: data.id_warga || data.id_user, // Backend expects id_warga
        tanggal: data.tanggal, // Should be in YYYY-MM-DD format
        check_in: toMySQLDateTime(data.check_in),
        check_out: toMySQLDateTime(data.check_out),
        status: data.status,
      };
    
      console.log("createPresensi - Input data:", data);
      console.log("createPresensi - Backend data:", backendData);
    
      const result = await apiClient.post("/presensi",backendData);
    
      console.log("createPresensi - Result:", result);
      return result;
    }

     const markAttendance = async (
      id_user: string,
      status: "hadir" | "izin" | "sakit" | "alpha",
      markedBy: string,
      checkInTime?: Date
    ): Promise<Presensi> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    
      try {
        console.log(`=== markAttendance START ===`);
        console.log(`markAttendance called: id_user=${id_user}, status=${status}`);
    
        const today = new Date();
    
        // Format tanggal untuk database (YYYY-MM-DD) - gunakan LOCAL timezone bukan UTC
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const tanggalStr = `${year}-${month}-${day}`;
    
        const mappedStatus = mapStatusToBackend(status);
        console.log(`Mapped status: ${status} -> ${mappedStatus}`);
        console.log(`Tanggal untuk database: ${tanggalStr}`);
    
        // Try to get existing attendance from backend
        console.log(`Fetching today's presensi...`);
        const todayPresensi = await getTodayPresensi();
        console.log(`Found ${todayPresensi.length} presensi records for today`);
    
        const existingAttendance = todayPresensi.find((p) => p.id_user === id_user);
    
        if (existingAttendance) {
          console.log(`Updating existing attendance for id_user ${id_user}`);
          // Update existing attendance
          const updated = await updatePresensi(existingAttendance.id, {
            id_warga: id_user, // Backend mengharapkan id_warga
            tanggal: tanggalStr, // Format tanggal yang benar
            status: mappedStatus, // Map status ke format backend
            check_in: checkInTime || existingAttendance.check_in,
          });
          console.log(`Update result:`, updated);
          console.log(`=== markAttendance END (UPDATE) ===`);
          return updated;
        }
    
        // Create new attendance record
        console.log(`Creating new attendance for id_user ${id_user}`);
        const newAttendance = await createPresensi({
          id_warga: id_user, // Backend mengharapkan id_warga bukan id_user
          check_in: checkInTime || new Date(),
          check_out: null,
          tanggal: tanggalStr, // Kirim tanggal dalam format string YYYY-MM-DD
          status: mappedStatus, // Map status ke format backend
        });
    
        console.log(`Create result:`, newAttendance);
        console.log(`=== markAttendance END (CREATE) ===`);
        return newAttendance;
      } catch (error) {
        console.error("=== markAttendance ERROR ===");
        console.error("Error saving attendance to backend:", error);
        // Fallback to mock data if API fails
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const existingAttendance = mockPresensi.find((p) => {
          const attendanceDate = new Date(p.tanggal);
          attendanceDate.setHours(0, 0, 0, 0);
          return (
            p.id_user === id_user && attendanceDate.getTime() === today.getTime()
          );
        });
    
        if (existingAttendance) {
          const index = mockPresensi.findIndex(
            (p) => p.id === existingAttendance.id
          );
          if (index !== -1) {
            mockPresensi[index] = {
              ...mockPresensi[index],
              status,
              check_in: checkInTime || mockPresensi[index].check_in,
              updatedAt: new Date(),
            };
            return mockPresensi[index];
          }
        }
    
        const newAttendance: Presensi = {
          id: (mockPresensi.length + 1).toString(),
          id_user,
          check_in: checkInTime || new Date(),
          check_out: null,
          tanggal: today,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
    
        mockPresensi.push(newAttendance);
        return newAttendance;
      }
    };

  // Function untuk fetch data - dipisah agar bisa dipanggil ulang
  const fetchData = async () => {
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Cek jadwal petugas yang sedang login
      
      // Untuk role petugas, cek apakah user punya jadwal hari ini
      if (user.role === 'petugas' && user.id) {
        const userScheduleCheck = await apiClient.get(`/petugas/${user.id}/check-schedule`).then((response) => response.data) as any
        setHasScheduleToday(userScheduleCheck.hasScheduleToday)
        setScheduleInfo({
          todayName: userScheduleCheck.todayName,
          jadwalHari: userScheduleCheck.jadwalHari || '',
          namaKelompok: userScheduleCheck.namaKelompok || ''
        })
      } else {
        // Admin dan super_admin selalu bisa akses
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
      }
      
      // Format tanggal ke YYYY-MM-DD
      const todayStr = today.toISOString().split('T')[0]
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const [attendance, session, PetugasData, presensiData] = await Promise.all([
        getTodayAttendance(user.id),
        getCurrentSession(),
        getAllPetugas(),
        getPresensiByDateRange(todayStr, tomorrowStr),
      ])

      setTodayAttendance(attendance)
      setCurrentSession(session)
      
      // Filter petugas berdasarkan status aktif dan jadwal hari ini
      const activePetugas = PetugasData.filter((p) => p.status === "Aktif")
      const todayScheduledPetugas = activePetugas.filter((p) => {
        // Cast p ke any untuk akses jadwalHari
        const jadwalHari = (p as any).jadwalHari
        return isScheduledToday(jadwalHari)
      })
      
      setPetugas(todayScheduledPetugas)
      setPresensi(presensiData)
      
      // Debug logging
      console.log('\n=== ATTENDANCE TRACKER DEBUG ===')
      console.log('Today is:', getTodayDayName())
      console.log('Date range for presensi query:', todayStr, 'to', tomorrowStr)
      console.log('User role:', user.role, 'hasScheduleToday:', hasScheduleToday)
      console.log(`\nTotal presensi records from DB: ${presensiData.length}`)
      console.log('Presensi data from DB:', presensiData.map((p: any) => ({ 
        id_warga: p.id_warga, 
        namaWarga: p.namaWarga, 
        status: p.status, 
        tanggal: p.tanggal 
      })))
      console.log(`\nAll active petugas count: ${activePetugas.length}`)
      console.log(`Today scheduled petugas count: ${todayScheduledPetugas.length}`)
      console.log('Today scheduled petugas:', todayScheduledPetugas.map(p => ({ 
        id: p.id, 
        id_warga: p.id_warga,
        nama: p.namaLengkap, 
        jadwal: (p as any).jadwalHari 
      })))

      const statusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
      const checkInMap: Record<string, Date> = {}
      
      console.log('\n=== MAPPING ATTENDANCE TO PETUGAS ===')
      
      // Map status berdasarkan id_warga dari petugas yang terjadwal hari ini
      todayScheduledPetugas.forEach((petugas) => {
        const attendance = presensiData.find((pr) => {
          // Pastikan perbandingan menggunakan tipe yang sama
          const match = String(pr.id_warga) === String(petugas.id_warga)
          console.log(`  Comparing: DB id_warga=${pr.id_warga} (${typeof pr.id_warga}) vs Petugas id_warga=${petugas.id_warga} (${typeof petugas.id_warga}) => ${match}`)
          return match
        })
        
        console.log(`\nPetugas: ${petugas.namaLengkap} (id=${petugas.id}, id_warga=${petugas.id_warga})`)
        
        if (attendance) {
          // Konversi status dari backend ke frontend format
          let frontendStatus: "hadir" | "izin" | "sakit" | "alpha" = "hadir"
          const statusString = (attendance.status as string).toLowerCase()
          
          console.log(`  ✓ Found attendance: status="${statusString}", tanggal=${attendance.tanggal}, check_in=${attendance.check_in}`)
          
          switch (statusString) {
            case "hadir":
              frontendStatus = "hadir"
              break
            case "izin":
              frontendStatus = "izin"
              break
            case "sakit":
              frontendStatus = "sakit"
              break
            case "alpha":
            case "tidak hadir":
              frontendStatus = "alpha"
              break
            default:
              frontendStatus = "hadir"
          }
          
          statusMap[petugas.id] = frontendStatus
          console.log(`  ✓ Mapped to statusMap[${petugas.id}] = "${frontendStatus}"`)
          
          if (attendance.check_in) {
            checkInMap[petugas.id] = new Date(attendance.check_in)
            console.log(`  ✓ Mapped check_in time: ${attendance.check_in}`)
          }
        } else {
          console.log(`  ✗ No attendance found - checkbox will remain unchecked`)
        }
      })
      
      console.log('\n=== FINAL STATUS MAP ===')
      console.log('statusMap:', statusMap)
      console.log('checkInMap keys:', Object.keys(checkInMap))
      console.log('=== END MAPPING ===\n')
      
      console.log('Final statusMap:', statusMap)
      console.log('Final checkInMap keys:', Object.keys(checkInMap))
      
      setSelectedStatuses(statusMap)
      setCheckInTimes(checkInMap)
    } catch (err) {
      setError("Gagal memuat data absensi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Auto-refresh data setiap 30 detik
    const dataInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing attendance data...')
        fetchData()
      }
    }, 30000)
    
    // Event listener untuk refresh data saat halaman di-focus kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page is visible again, refreshing data...')
        fetchData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(timeInterval)
      clearInterval(dataInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user.id])

  // ================== VALIDASI JAM ABSENSI ==================
  const isWithinAttendanceTime = () => {
    const now = new Date()
    const hours = now.getHours()
    const AWAL_WAKTU_PERTAMA = process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA)) ? parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA) : 21
    const AKHIR_WAKTU_PERTAMA = process.env.NEXT_PUBLIC_AKHIR_WAKTU_PERTAMA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_PERTAMA)) ? parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_PERTAMA) : 21
    const AWAL_WAKTU_KEDUA = process.env.NEXT_PUBLIC_AWAL_WAKTU_KEDUA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_KEDUA)) ? parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_KEDUA) : 0
    const AKHIR_WAKTU_KEDUA = process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA)) ? parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA) : 4
    // Jam 21:00 (21) sampai 23:59 atau jam 00:00 (0) sampai 04:00 (4)
    return (hours >= AWAL_WAKTU_PERTAMA && hours <= AKHIR_WAKTU_PERTAMA) || (hours >= AWAL_WAKTU_KEDUA && hours < AKHIR_WAKTU_KEDUA)
  }

  const getAttendanceTimeMessage = () => {
    const AWAL_WAKTU_PERTAMA = process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA)) ? parseInt(process.env.NEXT_PUBLIC_AWAL_WAKTU_PERTAMA) : 21
    const AKHIR_WAKTU_KEDUA = process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA && !isNaN(parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA)) ? parseInt(process.env.NEXT_PUBLIC_AKHIR_WAKTU_KEDUA) : 4
    return `Absensi hanya dapat dilakukan antara jam ${AWAL_WAKTU_PERTAMA}:00 - ${AKHIR_WAKTU_KEDUA}:00`
  }

  // ================== FUNCTION CHECK-IN & CHECK-OUT ==================
  const handleCheckIn = async () => {
    // Validasi jam absensi
    if (!isWithinAttendanceTime()) {
      setError(getAttendanceTimeMessage())
      toast({
        title: "Waktu Absensi Tidak Valid",
        description: getAttendanceTimeMessage(),
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      const attendance = await checkInAttendance(user.id)
      setTodayAttendance(attendance)
      setSuccess("Check-in berhasil! Selamat bertugas.")
      toast({
        title: "Berhasil",
        description: "Check-in berhasil! Selamat bertugas.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan check-in")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Gagal melakukan check-in",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    // Validasi jam absensi
    if (!isWithinAttendanceTime()) {
      setError(getAttendanceTimeMessage())
      toast({
        title: "Waktu Absensi Tidak Valid",
        description: getAttendanceTimeMessage(),
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      const attendance = await checkOutAttendance(user.id)
      setTodayAttendance(attendance)
      setSuccess("Check-out berhasil! Terima kasih atas kerja keras Anda.")
      toast({
        title: "Berhasil",
        description: "Check-out berhasil! Terima kasih atas kerja keras Anda.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan check-out")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Gagal melakukan check-out",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // ================== FUNCTION ABSENSI PETUGAS ==================
  const handleCheckboxChange = (idPetugas: string, status: "hadir" | "izin" | "sakit" | "alpha", checked: boolean) => {
    // Validasi jam absensi
    if (!isWithinAttendanceTime()) {
      toast({
        title: "Waktu Absensi Tidak Valid",
        description: getAttendanceTimeMessage(),
        variant: "destructive",
      })
      return
    }

    setSelectedStatuses((prev) => {
      const next = { ...prev }
      if (checked) {
        next[idPetugas] = status
      } else {
        // Jika di-uncheck, hapus dari state (tidak ada status yang terpilih)
        delete next[idPetugas]
      }
      return next
    })

    // Jika status hadir dipilih, simpan waktu saat ini
    if (checked && status === "hadir") {
      setCheckInTimes((prev) => ({
        ...prev,
        [idPetugas]: new Date(),
      }))
    } else if (checked && status !== "hadir") {
      // Jika pilih status selain hadir, hapus check-in time
      setCheckInTimes((prev) => {
        const next = { ...prev }
        delete next[idPetugas]
        return next
      })
    } else if (!checked) {
      // Jika di-uncheck, hapus check-in time juga
      setCheckInTimes((prev) => {
        const next = { ...prev }
        delete next[idPetugas]
        return next
      })
    }
  }

  const handleSaveAll = async () => {
    // Validasi jam absensi
    if (!isWithinAttendanceTime()) {
      setError(getAttendanceTimeMessage())
      toast({
        title: "Waktu Absensi Tidak Valid",
        description: getAttendanceTimeMessage(),
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    setError("")
    setSuccess("")
    try {
      // Filter petugas yang memiliki id_warga valid DAN sudah dipilih statusnya
      const validPetugas = petugas.filter(p => p.id_warga && selectedStatuses[p.id])
      
      if (validPetugas.length === 0) {
        setError("Tidak ada petugas yang dipilih untuk diabsen. Silakan pilih status absensi terlebih dahulu.")
        return
      }
      
      console.log('=== SAVING ATTENDANCE ===')
      console.log('Valid petugas to save:', validPetugas.length)
      
      await Promise.all(
        validPetugas.map((p) => {
          const status = selectedStatuses[p.id]
          const checkInTime = checkInTimes[p.id]
          console.log(`Saving attendance for ${p.namaLengkap}: status=${status}, id_warga=${p.id_warga}`)
          // Gunakan id_warga dari petugas untuk presensi
          return markAttendance(p.id_warga!, status, user.id, checkInTime)
        }),
      )
      
      setSuccess(`Absensi berhasil disimpan untuk ${validPetugas.length} petugas`)
      
      // Tunggu sebentar untuk memastikan data tersimpan di database
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Refresh SEMUA data termasuk petugas dan presensi
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Format tanggal ke YYYY-MM-DD
      const todayStr = today.toISOString().split('T')[0]
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const [newPetugasData, newPresensiData] = await Promise.all([
        getAllPetugas(),
        getPresensiByDateRange(todayStr, tomorrowStr),
      ])
      
      // Filter petugas yang aktif dan terjadwal hari ini
      const activePetugas = newPetugasData.filter((p) => p.status === "Aktif")
      const todayScheduledPetugas = activePetugas.filter((p) => {
        const jadwalHari = (p as any).jadwalHari
        return isScheduledToday(jadwalHari)
      })
      
      setPetugas(todayScheduledPetugas)
      setPresensi(newPresensiData)
      
      console.log('Refreshed data after save:', {
        petugas: todayScheduledPetugas.length,
        presensi: newPresensiData.length
      })
      
      // Map ulang data dari database ke selectedStatuses dan checkInTimes
      // agar tampilan langsung update tanpa perlu refresh halaman
      const newStatusMap: Record<string, "hadir" | "izin" | "sakit" | "alpha"> = {}
      const newCheckInMap: Record<string, Date> = {}
      
      todayScheduledPetugas.forEach((petugas) => {
        const attendance = newPresensiData.find((pr) => String(pr.id_warga) === String(petugas.id_warga))
        
        if (attendance) {
          let frontendStatus: "hadir" | "izin" | "sakit" | "alpha" = "hadir"
          const statusString = (attendance.status as string).toLowerCase()
          
          switch (statusString) {
            case "hadir":
              frontendStatus = "hadir"
              break
            case "izin":
              frontendStatus = "izin"
              break
            case "sakit":
              frontendStatus = "sakit"
              break
            case "alpha":
            case "tidak hadir":
              frontendStatus = "alpha"
              break
            default:
              frontendStatus = "hadir"
          }
          
          newStatusMap[petugas.id] = frontendStatus
          if (attendance.check_in) {
            newCheckInMap[petugas.id] = new Date(attendance.check_in)
          }
        }
      })
      
      // Update state dengan data terbaru dari database
      setSelectedStatuses(newStatusMap)
      setCheckInTimes(newCheckInMap)
      
      console.log('Updated UI state from database:', {
        statusMap: newStatusMap,
        checkInMap: Object.keys(newCheckInMap)
      })
      
    } catch (err) {
      console.error('Error saving attendance:', err)
      setError("Gagal menyimpan absensi massal")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditMode = () => {
    setIsEditMode(true)
    toast({
      title: "Mode Edit Diaktifkan",
      description: "Anda sekarang dapat mengubah status absensi yang sudah tersimpan. Jangan lupa klik 'Simpan Absensi' setelah selesai mengedit.",
      duration: 5000,
    })
  }

  const getStatusBadge = (status: string) => {
    // Normalize status untuk menangani variasi dari backend
    const normalizedStatus = status.toLowerCase()
    
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-primary", label: "Hadir" },
      izin: { variant: "secondary" as const, className: "bg-blue-500", label: "Izin" },
      sakit: { variant: "secondary" as const, className: "bg-yellow-500", label: "Sakit" },
      alpha: { variant: "destructive" as const, className: "bg-red-500", label: "Alpha" },
      "tidak hadir": { variant: "destructive" as const, className: "bg-red-500", label: "Tidak Hadir" },
    }
    
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.hadir
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const calculateWorkDuration = (checkIn: Date, checkOut?: Date | null) => {
    const endTime = checkOut || new Date()
    const duration = endTime.getTime() - checkIn.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
  }

  const formatTime = (date: Date) => format(date, "HH:mm:ss", { locale: id })
  const formatDate = (date: Date) => format(date, "EEEE, dd MMMM yyyy", { locale: id })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading data absensi...</p>
        </div>
      </div>
    )
  }

  // Jika user adalah petugas dan tidak memiliki jadwal hari ini
  if (user.role === 'petugas' && !hasScheduleToday) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Calendar className="h-5 w-5" />
              Tidak Ada Jadwal Ronda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="border-orange-300 bg-orange-100">
                <Calendar className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <div className="font-semibold mb-2">Hari ini bukan jadwal ronda Anda. Anda tidak dapat melakukan absensi.</div>
                  <div className="space-y-1 text-sm">
                    <div>• Hari ini: <strong>{scheduleInfo.todayName}</strong></div>
                    {scheduleInfo.namaKelompok && (
                      <div>• Kelompok Anda: <strong>{scheduleInfo.namaKelompok}</strong></div>
                    )}
                    {scheduleInfo.jadwalHari && (
                      <div>• Jadwal ronda Anda: <strong>{scheduleInfo.jadwalHari}</strong></div>
                    )}
                    {!scheduleInfo.jadwalHari && (
                      <div className="text-red-600">• Anda belum terdaftar dalam kelompok ronda manapun</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground">
                <p>Silakan hubungi admin jika ada kesalahan pada jadwal ronda Anda.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tampilkan informasi sesi untuk referensi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informasi Sesi Ronda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Waktu Saat Ini</div>
                <div className="text-2xl font-mono font-bold">{formatTime(currentTime)}</div>
                <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Status Sesi</div>
                {currentSession ? (
                  <div>
                    <Badge variant="default" className="bg-primary mb-2">
                      Sesi Aktif
                    </Badge>
                    <div className="text-sm">
                      <div>Waktu: {currentSession.startTime} - {currentSession.endTime}</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Badge variant="secondary">Sesi Tidak Aktif</Badge>
                    <div className="text-sm text-muted-foreground mt-1">Sesi ronda: 21:00 - 04:00</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter data presensi hari ini saja berdasarkan tanggal
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
  const filteredPresensi = presensi.filter((p) => {
    if (!p.tanggal) return false
    const presensiDate = new Date(p.tanggal).toISOString().split('T')[0]
    return presensiDate === todayStr
  })

  return (
    <div className="space-y-6">
      {/* Current Time & Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Informasi Sesi Ronda
          </CardTitle>
          <CardDescription>Status sesi ronda dan waktu saat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Waktu Saat Ini</div>
              <div className="text-2xl font-mono font-bold">{formatTime(currentTime)}</div>
              <div className="text-sm text-muted-foreground">{formatDate(currentTime)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Hari Ronda</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Badge variant="default" className="bg-blue-500">
                  {getTodayDayName()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {petugas.length > 0 ? `${petugas.length} anggota kelompok ronda` : 'Tidak ada anggota kelompok ronda'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status Sesi</div>
              {currentSession ? (
                <div>
                  <Badge variant="default" className="bg-primary mb-2">
                    Sesi Aktif
                  </Badge>
                  <div className="text-sm">
                    <div>
                      Waktu: 21:00 - 04:00
                    </div>
                    <div>
                      Petugas Hadir: {filteredPresensi.filter(p => p.status?.toLowerCase() === 'hadir').length}/{petugas.length}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge variant="secondary">Sesi Tidak Aktif</Badge>
                  <div className="text-sm text-muted-foreground mt-1">Sesi ronda: 21:00 - 04:00</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Attendance Form */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-xl">Tandai Absensi Anggota Ronda Hari Ini</CardTitle>
              <CardDescription className="mt-2">
                Absensi anggota kelompok ronda pada hari {getTodayDayName()}.
                {petugas.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs">
                      {petugas.filter(p => p.id_warga).length} dari {petugas.length} petugas dapat diabsen
                      {petugas.filter(p => !p.id_warga).length > 0 && (
                        <span className="text-yellow-600"> • {petugas.filter(p => !p.id_warga).length} petugas memiliki data tidak lengkap</span>
                      )}
                    </span>
                  </div>
                )}
                {petugas.length === 0 && (
                  <div className="mt-1">
                    <span className="text-orange-600 text-xs">
                      Tidak ada petugas yang terjadwal ronda pada hari {getTodayDayName()}
                    </span>
                  </div>
                )}
                {user.role !== 'petugas' && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Anda login sebagai {user.role === 'admin' ? 'Admin' : 'Super Admin'} - dapat mengelola semua absensi
                    </Badge>
                  </div>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                variant="outline" 
                onClick={handleEditMode}
                disabled={actionLoading || petugas.filter(p => p.id_warga).length === 0}
                className="flex-1 sm:flex-none"
              >
                Edit
              </Button>
              <Button 
                onClick={handleSaveAll} 
                disabled={actionLoading || petugas.filter(p => p.id_warga).length === 0 || Object.keys(selectedStatuses).length === 0}
                className="flex-1 sm:flex-none"
              >
                {actionLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Absensi"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Kelompok & Jadwal</TableHead>
                  <TableHead className="text-center w-24">Hadir</TableHead>
                  <TableHead className="text-center w-24">Izin</TableHead>
                  <TableHead className="text-center w-24">Sakit</TableHead>
                  <TableHead className="text-center w-24">Alpha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petugas.map((p) => {
                  const current = selectedStatuses[p.id] || "hadir"
                  const hasValidWarga = !!p.id_warga
                  return (
                    <TableRow key={p.id} className={!hasValidWarga ? "opacity-50 bg-muted/30" : ""}>
                      <TableCell className="font-medium">
                        {p.namaLengkap}
                        {!hasValidWarga && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Data Tidak Lengkap
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.jabatan || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          <div>{p.namaKelompok || "-"}</div>
                          <div className="text-xs text-blue-600">
                            {formatScheduleDisplay((p as any).jadwalHari)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "hadir"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "hadir", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} hadir`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "izin"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "izin", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} izin`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "sakit"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "sakit", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} sakit`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={current === "alpha"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "alpha", Boolean(c))}
                            aria-label={`Tandai ${p.namaLengkap} alpha`}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     hover:border-foreground/60
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground
                                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {petugas.map((p) => {
              const current = selectedStatuses[p.id] || "hadir"
              const hasValidWarga = !!p.id_warga
              return (
                <Card key={p.id} className={!hasValidWarga ? "opacity-50 bg-muted/30" : ""}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Petugas Info */}
                      <div>
                        <div className="font-semibold text-base">{p.namaLengkap}</div>
                        <div className="text-sm text-muted-foreground mt-1">{p.jabatan || "-"}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {p.namaKelompok || "-"}
                          </Badge>
                          <span className="text-xs text-blue-600">
                            {formatScheduleDisplay((p as any).jadwalHari)}
                          </span>
                        </div>
                        {!hasValidWarga && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Data Tidak Lengkap
                          </Badge>
                        )}
                      </div>

                      {/* Status Checkboxes */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded border">
                          <Checkbox
                            checked={current === "hadir"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "hadir", Boolean(c))}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm font-medium">Hadir</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded border">
                          <Checkbox
                            checked={current === "izin"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "izin", Boolean(c))}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm font-medium">Izin</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded border">
                          <Checkbox
                            checked={current === "sakit"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "sakit", Boolean(c))}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm font-medium">Sakit</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded border">
                          <Checkbox
                            checked={current === "alpha"}
                            disabled={!hasValidWarga}
                            onCheckedChange={(c) => handleCheckboxChange(p.id, "alpha", Boolean(c))}
                            className="h-5 w-5 rounded-md border-2 border-foreground/40 transition-colors
                                     data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm font-medium">Alpha</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {petugas.length === 0 && (
              <div className="text-center py-8 border rounded-lg">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Tidak ada petugas yang terjadwal ronda hari ini</p>
                <p className="text-sm text-muted-foreground mt-1">Hari {getTodayDayName()} tidak ada jadwal ronda</p>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-primary/20 bg-primary/10 mt-4">
              <UserCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Daftar Absensi Petugas Ronda</CardTitle>
          <CardDescription>
            Menampilkan {petugas.length} petugas yang terjadwal ronda pada hari {getTodayDayName()}
            {filteredPresensi.length > 0 && (
              <span className="text-xs block mt-1">
                {filteredPresensi.length} record absensi tersimpan hari ini
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {petugas.map((p) => {
                  // Cari data presensi berdasarkan id_warga dari database
                  const savedAttendance = filteredPresensi.find((pr) => pr.id_warga === p.id_warga)
                  
                  // Prioritaskan status dari database (sudah disimpan)
                  // Jika tidak ada di database, gunakan status yang dipilih user (belum disimpan)
                  let displayStatus: "hadir" | "izin" | "sakit" | "alpha" | null = null
                  
                  if (savedAttendance) {
                    // Ada data dari database - konversi dari backend format
                    const statusString = (savedAttendance.status as string).toLowerCase()
                    switch (statusString) {
                      case "hadir":
                        displayStatus = "hadir"
                        break
                      case "izin":
                        displayStatus = "izin"
                        break
                      case "sakit":
                        displayStatus = "sakit"
                        break
                      case "alpha":
                      case "tidak hadir":
                        displayStatus = "alpha"
                        break
                      default:
                        displayStatus = "hadir"
                    }
                  } else if (selectedStatuses[p.id]) {
                    // Belum ada di database, tapi ada status yang dipilih user
                    displayStatus = selectedStatuses[p.id]
                  }
                  
                  // Untuk check-in time, prioritaskan yang dari database, kemudian yang baru dipilih
                  let checkInTime: Date | null = null
                  if (savedAttendance?.check_in) {
                    checkInTime = new Date(savedAttendance.check_in)
                  } else if (checkInTimes[p.id]) {
                    checkInTime = checkInTimes[p.id]
                  }
                  
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.namaLengkap}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {checkInTime ? format(checkInTime, "HH:mm:ss", { locale: id }) : "-"}
                      </TableCell>
                      <TableCell>
                        {displayStatus ? getStatusBadge(displayStatus) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                            Belum Diabsen
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {petugas.map((p) => {
              const savedAttendance = filteredPresensi.find((pr) => pr.id_warga === p.id_warga)
              
              let displayStatus: "hadir" | "izin" | "sakit" | "alpha" | null = null
              
              if (savedAttendance) {
                const statusString = (savedAttendance.status as string).toLowerCase()
                switch (statusString) {
                  case "hadir":
                    displayStatus = "hadir"
                    break
                  case "izin":
                    displayStatus = "izin"
                    break
                  case "sakit":
                    displayStatus = "sakit"
                    break
                  case "alpha":
                  case "tidak hadir":
                    displayStatus = "alpha"
                    break
                  default:
                    displayStatus = "hadir"
                }
              } else if (selectedStatuses[p.id]) {
                displayStatus = selectedStatuses[p.id]
              }
              
              let checkInTime: Date | null = null
              if (savedAttendance?.check_in) {
                checkInTime = new Date(savedAttendance.check_in)
              } else if (checkInTimes[p.id]) {
                checkInTime = checkInTimes[p.id]
              }
              
              return (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="font-semibold">{p.namaLengkap}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Check-in:</span>
                        <span className="font-mono">
                          {checkInTime ? format(checkInTime, "HH:mm:ss", { locale: id }) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {displayStatus ? getStatusBadge(displayStatus) : (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                            Belum Diabsen
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Petunjuk Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Tandai status kehadiran petugas dengan checkbox yang tersedia</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Waktu check-in akan otomatis terisi saat Anda menandai petugas hadir</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Klik tombol "Simpan Absensi" untuk menyimpan semua data</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <span>Jika salah input, hubungi PIC untuk pembatalan</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

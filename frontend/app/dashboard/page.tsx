"use client"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WargaDashboard } from "@/components/dashboard/warga-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Building2, Wallet, TrendingUp, Clock, QrCode, Receipt, RefreshCw } from "lucide-react"
import { getAllKelompokRonda } from "@/lib/database"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"

interface DashboardStats {
  totalWarga: number
  totalRumah: number
  totalDanaHariIni: number
  totalDanaBulanIni: number
  absensiHariIni: number
  transaksiHariIni: number
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat Pagi"
  if (hour < 15) return "Selamat Siang"
  if (hour < 18) return "Selamat Sore"
  return "Selamat Malam"
}

const getDayName = (date: Date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return days[date.getDay()]
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [greeting, setGreeting] = useState<string>(() => getGreeting())
  const [stats, setStats] = useState<DashboardStats>({
    totalWarga: 0,
    totalRumah: 0,
    totalDanaHariIni: 0,
    totalDanaBulanIni: 0,
    absensiHariIni: 0,
    transaksiHariIni: 0,
  })
  const [kelompokRondaList, setKelompokRondaList] = useState<any[]>([])
  const [userKelompok, setUserKelompok] = useState<any>(null)
  const [jadwalRonda, setJadwalRonda] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userAbsensiStatus, setUserAbsensiStatus] = useState<string>('Belum Absen')
  const [paymentStats, setPaymentStats] = useState<any>({
    sudahBayar: 0,
    belumBayar: 0,
    persenSudahBayar: 0,
    persenBelumBayar: 0
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Fetch dashboard stats untuk admin dan super_admin
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return
      
      try {
        const response = await apiClient.get(`/dashboard/stats?_t=${Date.now()}`)
        
        if (response.success) {
          console.log('[DASHBOARD] Stats received:', response.data)
          const data = response.data as any
          setStats({
            totalWarga: data?.totalWarga || 0,
            totalRumah: data?.totalRumah || 0,
            totalDanaHariIni: data?.totalDanaHariIni || 0,
            totalDanaBulanIni: data?.totalDanaBulanIni || 0,
            absensiHariIni: 0,
            transaksiHariIni: data?.transaksiHariIni || 0,
          })
          
          if ((response.data as any).statistikPembayaran) {
            setPaymentStats(data.statistikPembayaran)
          }
        }
      } catch (error) {
        console.error('[DASHBOARD] Error fetching stats:', error)
      }
    }

    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchDashboardStats()
      // Auto refresh setiap 30 detik
      const interval = setInterval(fetchDashboardStats, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.role])

  // Fetch data untuk petugas
  useEffect(() => {
    const fetchPetugasData = async () => {
      if (!user || user.role !== 'petugas') return
      
      setLoading(true)
      try {
        // Fetch data petugas berdasarkan username untuk mendapatkan kelompok
        const petugasRes = await apiClient.get(`/petugas?_t=${Date.now()}`)
        console.log({petugasRes})
        
        if (!petugasRes.success) {
          throw new Error(`API Error: ${petugasRes}`)
        }
        
        const petugasData = await petugasRes.data
        
        let currentPetugas = null
        
        if (petugasData && Array.isArray(petugasData)) {
          currentPetugas = petugasData.find((p: any) => p.username === user.username)
          console.log('Current Petugas:', currentPetugas)
          
          if (currentPetugas) {
            // Update user data dengan info kelompok
            const updatedUser = {
              ...user,
              idKelompokRonda: currentPetugas.kelompokId,
              id_warga: currentPetugas.id_warga,
              namaKelompok: currentPetugas.namaKelompok,
              jadwalHari: currentPetugas.jadwalHari
            }
            setUser(updatedUser)
          }
        }
        
        // Fetch transaksi hari ini
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]
        
        console.log('=== DATE DEBUG ===')
        console.log('Today:', today)
        console.log('Tomorrow:', tomorrowStr)
        
        const transaksiRes = await apiClient.get(`/transaksi?tanggal=${today}&_t=${Date.now()}`)
        
        if (!transaksiRes.success) {
          throw new Error(`Transaksi API Error: ${transaksiRes}`)
        }
        
        const transaksiData = await transaksiRes
        
        // Fetch absensi petugas hari ini - tambahkan cache buster
        const absensiRes = await apiClient.get(`/presensi?startDate=${today}&endDate=${tomorrowStr}&_t=${Date.now()}`)
        
        if (!absensiRes.success) {
          throw new Error(`Absensi API Error: ${absensiRes}`)
        }
        
        const absensiData = await absensiRes
        
        console.log('=== DASHBOARD DEBUG ===')
        console.log('User:', user)
        console.log('Current Petugas:', currentPetugas)
        console.log('Absensi data from API:', absensiData)
        
        if (transaksiData.success && Array.isArray(transaksiData.data)) {
          console.log('Transaksi hari ini:', transaksiData.data)
          const totalDana = transaksiData.data.reduce((sum: number, t: any) => {
            const nominal = parseFloat(t.nominal) || 0
            console.log(`Transaksi ID ${t.id}: Rp ${nominal}`)
            return sum + nominal
          }, 0)
          console.log('Total Dana Hari Ini:', totalDana)
          
          setStats(prev => ({
            ...prev,
            transaksiHariIni: (transaksiData.data as Array<any>).length,
            totalDanaHariIni: totalDana
          }))
        }
        
        if (absensiData.success && Array.isArray(absensiData.data)) {
          console.log('=== ABSENSI DATA CHECK ===')
          console.log('Total absensi records:', absensiData.data.length)
          console.log('All absensi records:', absensiData.data)
          
          // Cek status absensi user saat ini - GUNAKAN currentPetugas langsung
          let userAbsensi = null
          
          // PERBAIKAN: Gunakan currentPetugas.id_warga sebagai prioritas utama
          if (currentPetugas?.id_warga) {
            console.log(`\nSearching absensi for petugas:`)
            console.log(`  - Username: ${currentPetugas.username}`)
            console.log(`  - Nama: ${currentPetugas.namaLengkap}`)
            console.log(`  - id_warga: ${currentPetugas.id_warga}`)
            console.log(`  - Type: ${typeof currentPetugas.id_warga}`)
            
            console.log(`\nChecking each absensi record:`)
            absensiData.data.forEach((a: any, index: number) => {
              console.log(`  [${index}] id_warga: ${a.id_warga} (${typeof a.id_warga}), status: ${a.status}`)
            })
            
            userAbsensi = absensiData.data.find((a: any) => {
              const match = Number(a.id_warga) === Number(currentPetugas.id_warga)
              if (match) {
                console.log(`\n✅ MATCH FOUND!`)
                console.log(`  - Absensi id_warga: ${a.id_warga}`)
                console.log(`  - Petugas id_warga: ${currentPetugas.id_warga}`)
                console.log(`  - Status: ${a.status}`)
              }
              return match
            })
          } else {
            console.log('❌ currentPetugas atau id_warga tidak tersedia')
            console.log('currentPetugas:', currentPetugas)
          }
          
          console.log('\n=== RESULT ===')
          console.log('User absensi found:', userAbsensi)
          
          if (userAbsensi) {
            // Normalisasi status (capitalize first letter)
            const status = String(userAbsensi.status || 'Belum Absen')
            const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
            console.log(`Setting status to: ${normalizedStatus}`)
            setUserAbsensiStatus(normalizedStatus)
          } else {
            console.log('No absensi found, setting to: Belum Absen')
            setUserAbsensiStatus('Belum Absen')
          }
          
          // Hitung jumlah petugas hadir (case-insensitive)
          const hadirCount = absensiData.data.filter((a: any) => {
            const statusLower = String(a.status || '').toLowerCase()
            return statusLower === 'hadir'
          }).length
          
          console.log(`Total petugas hadir: ${hadirCount}`)
          console.log('===================\n')
          
          setStats(prev => ({
            ...prev,
            absensiHariIni: hadirCount
          }))
        } else {
          console.log('❌ Absensi data tidak valid atau kosong')
          console.log('absensiData:', absensiData)
        }
        
      } catch (error) {
        console.error('Error fetching petugas data:', error)
        
        // Tampilkan error yang lebih detail ke console
        if (error instanceof TypeError) {
          console.error('TypeError: Kemungkinan CORS issue atau backend tidak berjalan')
          console.error('Pastikan backend server berjalan di http://localhost:5006')
        } else if (error instanceof Error) {
          console.error('Error details:', error.message)
        }
        
        // Set default values saat error
        setUserAbsensiStatus('Belum Absen')
        setStats(prev => ({
          ...prev,
          transaksiHariIni: 0,
          totalDanaHariIni: 0,
          absensiHariIni: 0
        }))
      } finally {
        setLoading(false)
      }
    }

    if (user?.username) {
      fetchPetugasData()
      
      // Auto refresh setiap 10 detik untuk update data lebih cepat
      const interval = setInterval(fetchPetugasData, 10000)
      return () => clearInterval(interval)
    }
  }, [user?.username]) // Hanya re-run ketika username berubah

  // Fetch kelompok ronda untuk semua user
  useEffect(() => {
    const fetchKelompokRonda = async () => {
      try {
        const data = await getAllKelompokRonda()
        console.log({dataKelompok:data})
        setKelompokRondaList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Gagal memuat kelompok ronda:", error)
      }
    }

    fetchKelompokRonda()
  }, [])

  // Update greeting setiap menit agar tetap akurat dengan waktu
  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting())
    updateGreeting()
    const interval = setInterval(updateGreeting, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user && (user as any).jadwalHari) {
      // Parse jadwal dari user data (sudah diupdate dari petugas)
      const parseJadwal = (jadwalHari: string) => {
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
        const schedule: any[] = []
        
        if (jadwalHari.includes(' - ')) {
          // Format range: "Senin - Jumat"
          const [start, end] = jadwalHari.split(' - ').map(d => d.trim())
          const startIdx = days.indexOf(start)
          const endIdx = days.indexOf(end)
          
          if (startIdx !== -1 && endIdx !== -1) {
            if (startIdx <= endIdx) {
              for (let i = startIdx; i <= endIdx; i++) {
                schedule.push({ day: days[i], time: '19:00-06:00' })
              }
            } else {
              // Wrap around (e.g., Sabtu - Senin)
              for (let i = startIdx; i < days.length; i++) {
                schedule.push({ day: days[i], time: '19:00-06:00' })
              }
              for (let i = 0; i <= endIdx; i++) {
                schedule.push({ day: days[i], time: '19:00-06:00' })
              }
            }
          }
        } else {
          // Single day
          const day = jadwalHari.trim()
          if (days.includes(day)) {
            schedule.push({ day, time: '19:00-06:00' })
          }
        }
        
        return schedule
      }
      
      setJadwalRonda(parseJadwal((user as any).jadwalHari))
    }
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleManualRefresh = () => {
    // Trigger re-fetch dengan reload halaman
    window.location.reload()
  }

  const getPaymentStatus = (paid: number, target: number) => {
    if (!target || target <= 0) {
      return {
        percentRaw: 0,
        percentDisplay: 0,
        overpay: 0,
        isOverpay: false,
        isPaid: false,
      }
    }
    const percentRaw = Math.round((paid / target) * 100)
    const percentDisplay = Math.min(percentRaw, 100)
    const overpay = Math.max(paid - target, 0)
    return {
      percentRaw,
      percentDisplay,
      overpay,
      isOverpay: overpay > 0,
      isPaid: percentRaw >= 100,
    }
  }

  const renderPetugasDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transaksiHariIni}</div>
            <p className="text-xs text-muted-foreground">Transaksi berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Terkumpul</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaHariIni)}</div>
            <p className="text-xs text-muted-foreground">Hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Absensi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAbsensiStatus}</div>
            <p className="text-xs text-muted-foreground">{stats.absensiHariIni} petugas hadir hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scan Barcode</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/scan-barcode")}>
              Mulai Scan
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kelompok Ronda Hari Ini</CardTitle>
            <CardDescription>
              {getDayName(new Date())}, {new Date().toLocaleDateString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(user as any)?.namaKelompok ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{(user as any).namaKelompok}</span>
                  <Badge className="bg-primary">Aktif</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Jadwal: {(user as any).jadwalHari || '-'}</p>
                  <p className="mt-1">Waktu: 19:00 - 06:00</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Anda tidak terdaftar dalam kelompok ronda manapun</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jadwal Ronda</CardTitle>
            <CardDescription>Jadwal ronda {(user as any)?.namaKelompok || 'Anda'}</CardDescription>
          </CardHeader>
          <CardContent>
            {jadwalRonda.length > 0 ? (
              <div className="space-y-2">
                {jadwalRonda.map((schedule, i) => {
                  const currentDay = getDayName(new Date())
                  const isToday = schedule.day === currentDay
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className={isToday ? "font-medium" : ""}>{schedule.day}</span>
                      <Badge variant={isToday ? "default" : "secondary"}>
                        {isToday ? "Hari Ini" : schedule.time}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada jadwal ronda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWarga}</div>
            <p className="text-xs text-muted-foreground">Warga aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rumah</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRumah}</div>
            <p className="text-xs text-muted-foreground">Rumah terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Hari Ini</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaHariIni)}</div>
            <p className="text-xs text-muted-foreground">{stats.transaksiHariIni} transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDanaBulanIni)}</div>
            <p className="text-xs text-muted-foreground">Bulan {new Date().toLocaleDateString('id-ID', { month: 'long' })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Pembayaran Bulan Ini</CardTitle>
            <CardDescription>Status pembayaran warga bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Sudah Bayar</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{paymentStats.persenSudahBayar}%</span>
                    <span className="text-xs text-muted-foreground">({paymentStats.sudahBayar} warga)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-primary/30 rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full transition-all" 
                    style={{ width: `${paymentStats.persenSudahBayar}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Belum Bayar</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{paymentStats.persenBelumBayar}%</span>
                    <span className="text-xs text-muted-foreground">({paymentStats.belumBayar} warga)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-red-200 rounded-full">
                  <div 
                    className="h-2 bg-red-500 rounded-full transition-all" 
                    style={{ width: `${paymentStats.persenBelumBayar}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderDashboardContent = () => {
    if (!user) return null

    switch (user.role) {
      case "warga":
        return <WargaDashboard user={user} />
      case "petugas":
        return renderPetugasDashboard()
      case "admin":
      case "super_admin":
        return renderAdminDashboard()
      default:
        return renderAdminDashboard()
    }
  }

  // Fungsi untuk mendapatkan nama user dengan prioritas yang benar
  const getUserName = () => {
    if (!user) return "User"
    return (user as any).nama || user.namaLengkap || (user as any).name || user.username || "User"
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={`${greeting}, ${getUserName()}`}
    >
      {renderDashboardContent()}
    </DashboardLayout>
  )
}

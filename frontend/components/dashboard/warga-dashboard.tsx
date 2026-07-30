"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DollarSign, Target, UserCheck, Calendar, Users, CheckCircle, XCircle, AlertCircle, UserX, Filter, TrendingUp, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"

interface DashboardStats {
  totalJimpitan: number
  targetBulanIni: number
  persentaseTarget: number
  totalRumah: number
  rumahAktif: number
  totalTransaksi: number
  transaksiHariIni: number
  nominalHariIni: number
  statusBayar: 'LUNAS' | 'BELUM BAYAR'
  totalWargaHariIni: number
  wargaBayarHariIni: number
}

interface PresensiData {
  id: string
  id_warga: string
  namaWarga: string
  nik: string
  namaKelompok: string
  tanggal: string
  check_in: string | null
  check_out: string | null
  status: "Hadir" | "Izin" | "Sakit" | "Alpha"
  keterangan: string | null
}

interface PresensiStats {
  total: number
  hadir: number
  izin: number
  sakit: number
  alpha: number
}

interface WargaDashboardProps {
  user: User
}

export function WargaDashboard({ user }: WargaDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJimpitan: 0,
    targetBulanIni: 200000,
    persentaseTarget: 0,
    totalRumah: 0,
    rumahAktif: 0,
    totalTransaksi: 0,
    transaksiHariIni: 0,
    nominalHariIni: 0,
    statusBayar: 'BELUM BAYAR',
    totalWargaHariIni: 0,
    wargaBayarHariIni: 0
  })
  const [presensiData, setPresensiData] = useState<PresensiData[]>([])
  const [presensiStats, setPresensiStats] = useState<PresensiStats>({
    total: 0,
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
  })
  const [tanggalPresensi, setTanggalPresensi] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<"Hadir" | "Izin" | "Sakit" | "Alpha" | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [filterType, setFilterType] = useState<"kemarin" | "tanggal" | "bulan">("kemarin")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [monthlyPercentage, setMonthlyPercentage] = useState<number | null>(null)
  const [monthlyDays, setMonthlyDays] = useState<number>(0)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Fungsi untuk fetch presensi berdasarkan filter
  const fetchPresensiData = async () => {
    try {
      setLoading(true)
      let url = ''
      
      if (filterType === 'kemarin') {
        url = '/presensi/kemarin-malam'
      } else if (filterType === 'tanggal' && selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd')
        url = `/presensi/by-date?tanggal=${formattedDate}`
      } else if (filterType === 'bulan' && selectedMonth && selectedYear) {
        url = `/presensi/by-month?bulan=${selectedMonth}&tahun=${selectedYear}`
      } else {
        // Default ke kemarin malam jika filter tidak lengkap
        url = '/presensi/kemarin-malam'
      }
      
      const presensiRes = await apiClient.get(url) as any
      
      if (presensiRes.success) {
        setPresensiData(presensiRes.data)
        setPresensiStats(presensiRes.stats)
        setTanggalPresensi(presensiRes.tanggal || `${selectedYear}-${selectedMonth}`)
        
        // Jika filter bulan, set persentase bulanan
        if (filterType === 'bulan') {
          setMonthlyPercentage(presensiRes?.persentaseKehadiran || 0)
          setMonthlyDays(presensiRes?.jumlahHariRonda || 0)
        } else {
          setMonthlyPercentage(null)
          setMonthlyDays(0)
        }
      } else {
        // Data tidak ditemukan
        setPresensiData([])
        setPresensiStats({ total: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0 })
        setMonthlyPercentage(null)
        setMonthlyDays(0)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching presensi:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPresensiData()
    console.log({presensiData: presensiData})
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPresensiData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [filterType, selectedDate, selectedMonth, selectedYear])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch transaksi hari ini untuk semua warga
        const today = new Date().toISOString().split('T')[0]
        const transaksiRes = await apiClient.get(`/transaksi?tanggal=${today}`)  as any
        
        // Fetch total warga aktif
        const wargaRes = await apiClient.get('/warga')  as any
        
        // Fetch transaksi untuk user yang login (semua transaksi)
        const userTransaksiRes = await apiClient.get(`/transaksi?id_warga=${user.id}`)
        
        // Fetch transaksi hari ini untuk user yang login (gunakan filter tanggal)
        const userTodayRes = await apiClient.get(`/transaksi?id_warga=${user.id}&tanggal=${today}`)
        
        console.log('=== DEBUG DASHBOARD WARGA ===')
        console.log('Today:', today)
        console.log('User ID:', user.id)
        console.log('Transaksi hari ini user:', userTodayRes)
        
        let totalWargaAktif = 0
        let wargaBayarHariIni = 0
        
        if (wargaRes.success && Array.isArray(wargaRes.data)) {
          totalWargaAktif = wargaRes.data.filter((w: any) => w.statusAktif === 'Aktif').length
        }
        
        if (transaksiRes.success && Array.isArray(transaksiRes.data)) {
          // Hitung jumlah warga unik yang sudah bayar hari ini
          const uniqueWarga = new Set(transaksiRes.data.map((t: any) => t.id_warga))
          wargaBayarHariIni = uniqueWarga.size
        }
        
        // Status bayar: LUNAS jika semua warga aktif sudah bayar hari ini
        const statusBayar = (totalWargaAktif > 0 && wargaBayarHariIni >= totalWargaAktif) ? 'LUNAS' : 'BELUM LUNAS'
        
        // Hitung total jimpitan bulan ini untuk user
        let totalJimpitanBulanIni = 0
        let totalTransaksiBulanIni = 0
        let nominalTransaksiHariIni = 0
        
        if (userTransaksiRes.success && Array.isArray(userTransaksiRes.data)) {
          const currentMonth = new Date().getMonth()
          const currentYear = new Date().getFullYear()
          
          const transaksiBulanIni = userTransaksiRes.data.filter((t: any) => {
            if (!t.tanggal_setor) return false
            const tDate = new Date(t.tanggal_setor)
            if (isNaN(tDate.getTime())) return false
            return tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear &&
                   t.status_jimpitan === 'lunas'
          })
          
          totalJimpitanBulanIni = transaksiBulanIni.reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          totalTransaksiBulanIni = transaksiBulanIni.length
        }
        
        // Hitung nominal transaksi hari ini dari API filter tanggal
        if (userTodayRes.success && Array.isArray(userTodayRes.data)) {
          nominalTransaksiHariIni = userTodayRes.data
            .filter((t: any) => t.status_jimpitan === 'lunas')
            .reduce((sum: number, t: any) => sum + (parseFloat(t.nominal) || 0), 0)
          
          console.log('Nominal transaksi hari ini:', nominalTransaksiHariIni)
        }
        
        // Status bayar berdasarkan warga yang login: sudah bayar hari ini = LUNAS
        const userStatusBayar = nominalTransaksiHariIni > 0 ? 'LUNAS' : 'BELUM BAYAR'
        
        setStats({
          totalJimpitan: totalJimpitanBulanIni,
          targetBulanIni: 200000,
          persentaseTarget: Math.round((totalJimpitanBulanIni / 200000) * 100),
          totalRumah: wargaRes.success ? wargaRes.data.length : 0,
          rumahAktif: totalWargaAktif,
          totalTransaksi: totalTransaksiBulanIni,
          transaksiHariIni: transaksiRes.success ? transaksiRes.data.filter((t: any) => t.id_warga === user.id).length : 0,
          nominalHariIni: nominalTransaksiHariIni,
          statusBayar: userStatusBayar,
          totalWargaHariIni: totalWargaAktif,
          wargaBayarHariIni
        })
        
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.id) {
      fetchStats()
      
      // Auto-refresh setiap 30 detik
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchStats()
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTanggal = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPercentage = (value: number) => {
    return presensiStats.total > 0 ? Math.round((value / presensiStats.total) * 100) : 0
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Hadir":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Izin":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case "Sakit":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "Alpha":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <UserX className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Hadir: { className: "bg-green-100 text-green-800 border-green-300" },
      Izin: { className: "bg-blue-100 text-blue-800 border-blue-300" },
      Sakit: { className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      Alpha: { className: "bg-red-100 text-red-800 border-red-300" },
    }

    return (
      <Badge variant="outline" className={variants[status]?.className || ""}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Memuat dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Selamat datang, {(user as any).nama || user.namaLengkap || user.username}!
          </CardTitle>
          <CardDescription>
            Dashboard warga - Lihat informasi jimpitan Anda
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            <span className="text-lg font-bold text-muted-foreground">Rp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.totalJimpitan)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Bulan Ini</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.persentaseTarget}%</div>
            <p className="text-xs text-muted-foreground">{formatRupiah(stats.targetBulanIni)} target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Bayar</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge 
                variant={stats.statusBayar === 'LUNAS' ? 'default' : 'destructive'} 
                className={stats.statusBayar === 'LUNAS' ? 'bg-primary text-white' : 'bg-red-500 text-white'}
              >
                {stats.statusBayar === 'LUNAS' ? 'LUNAS' : 'KOSONG'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.statusBayar === 'LUNAS' ? 'Anda sudah bayar hari ini' : 'Anda belum bayar hari ini'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(stats.nominalHariIni)}</div>
            <p className="text-xs text-muted-foreground">Total {stats.totalTransaksi} bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter dan Grafik Kehadiran Petugas Ronda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Filter Data Ronda</CardTitle>
            </div>
          </div>
          <CardDescription>
            Pilih periode untuk melihat grafik partisipasi ronda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Type Selection */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === "kemarin" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("kemarin")}
              >
                Kemarin Malam
              </Button>
              <Button
                variant={filterType === "tanggal" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("tanggal")}
              >
                Pilih Tanggal
              </Button>
              <Button
                variant={filterType === "bulan" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("bulan")}
              >
                Pilih Bulan
              </Button>
            </div>

            {/* Date Picker with Calendar for specific date */}
            {filterType === "tanggal" && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Pilih Tanggal</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: id }) : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setIsCalendarOpen(false)
                        }}
                        disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                        initialFocus
                        locale={id}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Month & Year Picker */}
            {filterType === "bulan" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="selectedMonth">Bulan</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="selectedMonth">
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Januari</SelectItem>
                      <SelectItem value="2">Februari</SelectItem>
                      <SelectItem value="3">Maret</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">Mei</SelectItem>
                      <SelectItem value="6">Juni</SelectItem>
                      <SelectItem value="7">Juli</SelectItem>
                      <SelectItem value="8">Agustus</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">Oktober</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">Desember</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selectedYear">Tahun</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="selectedYear">
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Monthly Percentage Display */}
            {filterType === "bulan" && monthlyPercentage !== null && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Persentase Kehadiran Bulan Ini</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-700">{monthlyPercentage}%</div>
                      <p className="text-xs text-blue-600">{monthlyDays} hari ronda</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grafik Kehadiran Petugas - Hanya tampil jika ada data */}
      {presensiData?.length > 0 ? (
        <>
          {/* Grafik Bar Chart dengan Klik untuk Detail */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Grafik Partisipasi Ronda</CardTitle>
              </div>
              <CardDescription>
                {tanggalPresensi && `Kehadiran petugas - ${formatTanggal(tanggalPresensi)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bar Chart dengan Klik */}
                <div className="space-y-3">
                  {/* Hadir Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Hadir
                      </span>
                      <span className="text-sm font-medium text-green-700">
                        {presensiStats.hadir} ({getPercentage(presensiStats.hadir)}%)
                      </span>
                    </div>
                    <div 
                      className="relative h-10 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedStatus(selectedStatus === "Hadir" ? null : "Hadir")}
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-green-500 hover:bg-green-600 transition-all duration-500"
                        style={{ width: `${getPercentage(presensiStats.hadir)}%` }}
                      ></div>
                      {presensiStats.hadir > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-3 py-1 rounded">
                            Klik untuk detail
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Izin Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        Izin
                      </span>
                      <span className="text-sm font-medium text-blue-700">
                        {presensiStats.izin} ({getPercentage(presensiStats.izin)}%)
                      </span>
                    </div>
                    <div 
                      className="relative h-10 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedStatus(selectedStatus === "Izin" ? null : "Izin")}
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500 hover:bg-blue-600 transition-all duration-500"
                        style={{ width: `${getPercentage(presensiStats.izin)}%` }}
                      ></div>
                      {presensiStats.izin > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-3 py-1 rounded">
                            Klik untuk detail
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sakit Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        Sakit
                      </span>
                      <span className="text-sm font-medium text-yellow-700">
                        {presensiStats.sakit} ({getPercentage(presensiStats.sakit)}%)
                      </span>
                    </div>
                    <div 
                      className="relative h-10 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedStatus(selectedStatus === "Sakit" ? null : "Sakit")}
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-500"
                        style={{ width: `${getPercentage(presensiStats.sakit)}%` }}
                      ></div>
                      {presensiStats.sakit > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-3 py-1 rounded">
                            Klik untuk detail
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alpha Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Alpha
                      </span>
                      <span className="text-sm font-medium text-red-700">
                        {presensiStats.alpha} ({getPercentage(presensiStats.alpha)}%)
                      </span>
                    </div>
                    <div 
                      className="relative h-10 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedStatus(selectedStatus === "Alpha" ? null : "Alpha")}
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-red-500 hover:bg-red-600 transition-all duration-500"
                        style={{ width: `${getPercentage(presensiStats.alpha)}%` }}
                      ></div>
                      {presensiStats.alpha > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-3 py-1 rounded">
                            Klik untuk detail
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detail List - Muncul saat bar diklik */}
                {selectedStatus && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      {getStatusIcon(selectedStatus)}
                      Daftar Petugas - {selectedStatus}
                    </h4>
                    <div className="space-y-2">
                      {presensiData
                        .filter((item) => item.status === selectedStatus)
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${
                              selectedStatus === "Hadir"
                                ? "bg-green-50 border-green-200"
                                : selectedStatus === "Izin"
                                ? "bg-blue-50 border-blue-200"
                                : selectedStatus === "Sakit"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{item.namaWarga}</p>
                                {item.namaKelompok && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.namaKelompok}
                                  </p>
                                )}
                                {item.check_in && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Check-in: {item.check_in}
                                    {item.check_out && ` | Check-out: ${item.check_out}`}
                                  </p>
                                )}
                                {item.keterangan && (
                                  <p className="text-xs mt-1 font-medium">
                                    Keterangan: {item.keterangan}
                                  </p>
                                )}
                              </div>
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Tampilkan pesan jika tidak ada data */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Data Tidak Tersedia</h3>
              <p className="text-muted-foreground">
                Data tidak tersedia untuk periode ini. Silakan pilih periode lain.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

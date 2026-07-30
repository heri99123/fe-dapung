"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, XCircle, AlertCircle, UserX, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

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

interface PresensiResponse {
  success: boolean
  tanggal: string
  stats: PresensiStats
  data: PresensiData[]
}

export default function WargaDashboardPage() {
  const [presensiData, setPresensiData] = useState<PresensiData[]>([])
  const [stats, setStats] = useState<PresensiStats>({
    total: 0,
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
  })
  const [tanggal, setTanggal] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPresensiKemarin()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchPresensiKemarin()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchPresensiKemarin = async () => {
    try {
      const response = await apiClient.get("/presensi/kemarin-malam")
      const result = await response.data as any

      if (response.success) {
        setPresensiData(result.data)
        setStats(result.stats)
        setTanggal(result.tanggal)
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data presensi kemarin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching presensi:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data presensi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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

  const formatTanggal = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate percentage for chart
  const getPercentage = (value: number) => {
    return stats.total > 0 ? Math.round((value / stats.total) * 100) : 0
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Warga">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard Warga">
      <div className="space-y-6">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Kehadiran Petugas Ronda Kemarin Malam</CardTitle>
            </div>
            <CardDescription>
              {tanggal && `Tanggal: ${formatTanggal(tanggal)}`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Petugas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Petugas terdaftar</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Hadir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{stats.hadir}</div>
              <p className="text-xs text-green-600 mt-1">{getPercentage(stats.hadir)}% dari total</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Izin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.izin}</div>
              <p className="text-xs text-blue-600 mt-1">{getPercentage(stats.izin)}% dari total</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Sakit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{stats.sakit}</div>
              <p className="text-xs text-yellow-600 mt-1">{getPercentage(stats.sakit)}% dari total</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Alpha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{stats.alpha}</div>
              <p className="text-xs text-red-600 mt-1">{getPercentage(stats.alpha)}% dari total</p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grafik Partisipasi Ronda</CardTitle>
            <CardDescription>Visualisasi kehadiran petugas kemarin malam</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Hadir
                    </span>
                    <span className="text-sm font-medium text-green-700">
                      {stats.hadir} ({getPercentage(stats.hadir)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${getPercentage(stats.hadir)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      Izin
                    </span>
                    <span className="text-sm font-medium text-blue-700">
                      {stats.izin} ({getPercentage(stats.izin)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${getPercentage(stats.izin)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Sakit
                    </span>
                    <span className="text-sm font-medium text-yellow-700">
                      {stats.sakit} ({getPercentage(stats.sakit)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${getPercentage(stats.sakit)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Alpha
                    </span>
                    <span className="text-sm font-medium text-red-700">
                      {stats.alpha} ({getPercentage(stats.alpha)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${getPercentage(stats.alpha)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Kehadiran Detail</CardTitle>
            <CardDescription>Daftar lengkap petugas dan status kehadiran</CardDescription>
          </CardHeader>
          <CardContent>
            {presensiData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada data presensi untuk kemarin malam</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presensiData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-semibold">{item.namaWarga}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.namaKelompok || "Kelompok tidak tersedia"}
                        </p>
                        {item.check_in && (
                          <p className="text-xs text-muted-foreground">
                            Check-in: {item.check_in}
                            {item.check_out && ` | Check-out: ${item.check_out}`}
                          </p>
                        )}
                        {item.keterangan && (
                          <p className="text-xs text-blue-600 mt-1">
                            Keterangan: {item.keterangan}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

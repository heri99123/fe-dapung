"use client"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Wallet, TrendingUp } from "lucide-react"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"

interface AdminStats {
  totalWarga: number
  totalRumah: number
  totalDanaHariIni: number
  totalDanaBulanIni: number
  transaksiHariIni: number
  statistikPembayaran: {
    sudahBayar: number
    belumBayar: number
    persenSudahBayar: number
    persenBelumBayar: number
  }
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat Pagi"
  if (hour < 15) return "Selamat Siang"
  if (hour < 18) return "Selamat Sore"
  return "Selamat Malam"
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [greeting] = useState<string>(() => getGreeting())
  const [stats, setStats] = useState<AdminStats>({
    totalWarga: 0,
    totalRumah: 0,
    totalDanaHariIni: 0,
    totalDanaBulanIni: 0,
    transaksiHariIni: 0,
    statistikPembayaran: {
      sudahBayar: 0,
      belumBayar: 0,
      persenSudahBayar: 0,
      persenBelumBayar: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      
      // Redirect jika bukan admin
      if (parsedUser.role !== "admin") {
        window.location.href = "/dashboard"
      }
    }
  }, [])

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || user.role !== "admin") return
      
      setLoading(true)
      try {
        const response = await apiClient.get(`/dashboard/stats?_t=${Date.now()}`)
        
        if (response.success) {
          console.log('[ADMIN] Dashboard data:', response.data)
          const resp = response.data as any
          setStats({
            totalWarga: resp.totalWarga || 0,
            totalRumah: resp.totalRumah || 0,
            totalDanaHariIni: resp.totalDanaHariIni || 0,
            totalDanaBulanIni: resp.totalDanaBulanIni || 0,
            transaksiHariIni: resp.transaksiHariIni || 0,
            statistikPembayaran: resp.statistikPembayaran || {
              sudahBayar: 0,
              belumBayar: 0,
              persenSudahBayar: 0,
              persenBelumBayar: 0
            }
          })
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === "admin") {
      fetchAdminData()
      
      // Auto-refresh setiap 30 detik
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchAdminData()
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getUserName = () => {
    if (!user) return "Admin"
    return (user as any).nama || user.namaLengkap || (user as any).name || user.username || "Admin"
  }

  return (
    <DashboardLayout 
      title="Admin Dashboard" 
      subtitle={`${greeting}, ${getUserName()}`}
    >
      <div className="space-y-6">
        {/* Main Stats Grid */}
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

        {/* Statistik Pembayaran */}
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
                    <span className="text-sm font-medium">{stats.statistikPembayaran.persenSudahBayar}%</span>
                    <span className="text-xs text-muted-foreground">({stats.statistikPembayaran.sudahBayar} warga)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-primary/30 rounded-full">
                  <div 
                    className="h-2 bg-primary rounded-full transition-all" 
                    style={{ width: `${stats.statistikPembayaran.persenSudahBayar}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Belum Bayar</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stats.statistikPembayaran.persenBelumBayar}%</span>
                    <span className="text-xs text-muted-foreground">({stats.statistikPembayaran.belumBayar} warga)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-red-200 rounded-full">
                  <div 
                    className="h-2 bg-red-500 rounded-full transition-all" 
                    style={{ width: `${stats.statistikPembayaran.persenBelumBayar}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ringkasan */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Hari Ini</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Transaksi</span>
                  <span className="font-medium">{stats.transaksiHariIni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dana Terkumpul</span>
                  <span className="font-medium">{formatCurrency(stats.totalDanaHariIni)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rata-rata per Transaksi</span>
                  <span className="font-medium">
                    {stats.transaksiHariIni > 0 
                      ? formatCurrency(stats.totalDanaHariIni / stats.transaksiHariIni)
                      : formatCurrency(0)
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Bulan Ini</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Dana</span>
                  <span className="font-medium">{formatCurrency(stats.totalDanaBulanIni)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Warga Sudah Bayar</span>
                  <span className="font-medium">{stats.statistikPembayaran.sudahBayar} dari {stats.totalWarga}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tingkat Partisipasi</span>
                  <span className="font-medium">{stats.statistikPembayaran.persenSudahBayar}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

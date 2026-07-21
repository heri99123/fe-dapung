"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { History } from "lucide-react"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"
import dayjs from 'dayjs'
import "dayjs/locale/id";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

dayjs.locale("id");

interface TransaksiStats {
  totalJimpitan: number
  targetBulanIni: number
  persentaseTarget: number
  totalTransaksi: number
}

interface Transaksi {
  id: number
  id_warga: number
  id_user: number
  tanggal_setor: string
  waktu_input: string
  nominal: string
  status_jimpitan: string
  namaWarga: string
  nikWarga: string
  jenisDana: string
  created_at: string
  updated_at: string
}

const getCurrentMonth = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return month;
};

const getCurrentYear = () => {
  const now = new Date();
  const month = String(now.getFullYear())
  return month;
};

export default function DataTransaksiPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<TransaksiStats>({
    totalJimpitan: 0,
    targetBulanIni: 200000,
    persentaseTarget: 0,
    totalTransaksi: 0
  })
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedYear, setSelectedYear] = useState(getCurrentYear())

  const monthOptions = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])



  const fetchTransaksiData = async () => {
    if (!user || !user.id) return
    
    setLoading(true)
    try {
      // Fetch transaksi berdasarkan id warga
      const response = await apiClient.get(`/transaksi?id_warga=${user.id}&bulan=${selectedMonth}&tahun=${selectedYear}`)
      
      console.log('Transaksi data for user:', user.id, response.data)
      
      if (response.success && Array.isArray(response.data)) {
        setTransaksiList(response.data)
        
        // Hitung total jimpitan bulan ini
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        const transaksiBulanIni = response.data
          .filter((t: Transaksi) => {
            if (!t.tanggal_setor) return false
            const transaksiDate = new Date(t.tanggal_setor)
            return transaksiDate.getMonth() === currentMonth && 
                    transaksiDate.getFullYear() === currentYear &&
                    t.status_jimpitan === 'lunas'
          })

        const totalBulanIni = transaksiBulanIni.reduce((sum: number, t: Transaksi) => sum + (parseFloat(t.nominal) || 0), 0)
        
        setStats({
          totalJimpitan: totalBulanIni,
          targetBulanIni: 200000,
          persentaseTarget: Math.round((totalBulanIni / 200000) * 100),
          totalTransaksi: transaksiBulanIni?.length
        })
      }
    } catch (error) {
      console.error('Error fetching transaksi:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransaksiData()
  }, [user?.id, selectedMonth, selectedYear])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-"
    const date = new Date(tanggal)
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatWaktu = (waktu: string) => {
    if (!waktu) return ""
    const date = new Date(waktu)
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <DashboardLayout title="Data Transaksi" subtitle="Informasi lengkap transaksi jimpitan Anda">
      <div className="space-y-6">
        {/* Tab Content */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress" onClick={() => { setSelectedMonth(""); }}>Progress</TabsTrigger>
            <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Progress Bulanan</CardTitle>
                <CardDescription>
                  Total jimpitan bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Terkumpul: {formatRupiah(stats.totalJimpitan)}</span>
                    <span>{stats.totalTransaksi} transaksi</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(stats.persentaseTarget, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Jimpitan adalah shodaqoh bagi keluarga
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detail Status Pembayaran */}
            <Card>
              <CardHeader>
                <CardTitle>Detail Status Pembayaran</CardTitle>
                <CardDescription>
                  Informasi lengkap pembayaran jimpitan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="default" className={stats.totalJimpitan >= stats.targetBulanIni ? 'bg-primary' : 'bg-red-600'}>{stats.totalJimpitan >= stats.targetBulanIni ? 'LUNAS' : 'BELUM LUNAS'}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-muted-foreground">Bulan:</span>
                    <span className="text-sm font-semibold">{dayjs().format("MMMM YYYY")}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-muted-foreground">Tanggal Bayar:</span>
                    <span className="text-sm font-semibold">{transaksiList[0]?.tanggal_setor ? dayjs(transaksiList[0]?.tanggal_setor).format("DD MMMM YYYY") : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-muted-foreground">Jumlah:</span>
                    <span className="text-lg font-bold text-primary">{formatRupiah(stats.totalJimpitan)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex gap-2.5 mb-2.5">
                  <div>
                    <label className="text-sm font-semibold block">Bulan</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger id="selectedMonth">
                        <SelectValue placeholder="Pilih Bulan" />
                      </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold block">Tahun</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger id="selectedYear">
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }).map((_, index) => (
                          <SelectItem key={index} value={(2020 + index + 1).toString()}>
                            {(2020 + index + 1).toString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>
                  {transaksiList.length} transaksi ditemukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Memuat data transaksi...
                  </div>
                ) : transaksiList.length > 0 ? (
                  <div className="space-y-3">
                    {transaksiList.slice(0, 10).map((transaksi, index) => (
                      <div key={transaksi.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{transaksi.jenisDana || 'Jimpitan Harian'}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTanggal(transaksi.tanggal_setor)}
                            {transaksi.waktu_input && ` • ${formatWaktu(transaksi.waktu_input)}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatRupiah(parseFloat(transaksi.nominal))}</div>
                          <Badge variant={transaksi.status_jimpitan === "lunas" ? "default" : "destructive"} className="text-xs">
                            {transaksi.status_jimpitan === "lunas" ? "Lunas" : transaksi.status_jimpitan}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada transaksi
                  </div>
                )}
                {transaksiList.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      Lihat Semua Riwayat ({transaksiList.length} transaksi)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

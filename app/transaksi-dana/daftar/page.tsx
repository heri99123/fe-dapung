"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Coins
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getAllTransaksi } from "@/lib/database"

interface TransaksiResponse {
  id: string
  id_warga: string
  id_user: string
  tanggal_setor: string | null
  waktu_input: string | null
  nominal: number
  status_jimpitan: string
  namaWarga?: string
  nikWarga?: string
  jenisDana?: string
  created_at: string
  updated_at: string
}

interface PetugasLogin {
  id: string
  name: string
  username: string
  role: string
  loginTime: string
}

export default function DaftarTransaksiPage() {
  const [petugas, setPetugas] = useState<PetugasLogin | null>(null)
  const [transaksiList, setTransaksiList] = useState<TransaksiResponse[]>([])
  const [filteredTransaksi, setFilteredTransaksi] = useState<TransaksiResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const router = useRouter()

  useEffect(() => {
    // Cek login petugas
    const petugasData = localStorage.getItem("petugasLogin")
    if (!petugasData) {
      router.push("/login-transaksi")
      return
    }
    
    setPetugas(JSON.parse(petugasData))
    fetchTransaksi()
  }, [router])

  useEffect(() => {
    // Filter transaksi berdasarkan pencarian dan status
    let filtered = transaksiList

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(transaksi =>
        transaksi.namaWarga?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaksi.nikWarga?.includes(searchTerm) ||
        transaksi.jenisDana?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(transaksi => transaksi.status_jimpitan === selectedStatus)
    }

    setFilteredTransaksi(filtered)
  }, [searchTerm, selectedStatus, transaksiList])

  const fetchTransaksi = async () => {
    try {
      setLoading(true)
      const response = await getAllTransaksi()
      // Pastikan response dalam format array
      const data = Array.isArray(response) ? response : []
      setTransaksiList(data as any)
      setFilteredTransaksi(data as any)
    } catch (error) {
      console.error("Error fetching transaksi:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data transaksi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "lunas":
        return <Badge variant="default">Lunas</Badge>
      case "belum_lunas":
        return <Badge variant="secondary">Belum Lunas</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTotalTransaksi = () => {
    return filteredTransaksi.reduce((total, transaksi) => total + (transaksi.nominal || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <CardTitle className="text-xl">Daftar Transaksi</CardTitle>
                <CardDescription>
                  Total: {filteredTransaksi.length} transaksi • 
                  Total Nominal: <span className="font-medium">{formatCurrency(getTotalTransaksi())}</span>
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => router.push("/transaksi-dana")} className="bg-blue-600 hover:bg-blue-700">
              + Transaksi Baru
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter dan Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari nama warga, NIK, atau jenis dana..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum_lunas">Belum Lunas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Transaksi */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Menampilkan {filteredTransaksi.length} dari {transaksiList.length} transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransaksi.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransaksi.map((transaksi) => (
                <Card key={transaksi.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-medium text-card-foreground">
                            {transaksi.namaWarga || "Nama tidak tersedia"}
                          </h3>
                          {getStatusBadge(transaksi.status_jimpitan)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">NIK:</span>
                            <span>{transaksi.nikWarga || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Jenis:</span>
                            <span>{transaksi.jenisDana || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(transaksi.tanggal_setor)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {formatCurrency(transaksi.nominal || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Input: {formatTime(transaksi.waktu_input)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        ID Transaksi: #{transaksi.id}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
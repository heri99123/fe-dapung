"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  User, 
  Coins, 
  Calendar,
  Save,
  Search
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getKepalaKeluarga, checkPetugasScheduleToday } from "@/lib/database"
import { createTransaksi } from "@/lib/transactions"
import { getTodayDayName } from "@/lib/schedule-utils"
import type { Warga, JenisDana } from "@/types/database"
import { apiClient } from "@/lib/api"

interface PetugasLogin {
  id: string
  name: string
  username: string
  role: string
  loginTime: string
}

export default function InputManualPage() {
  const [petugas, setPetugas] = useState<PetugasLogin | null>(null)
  const [selectedJenis, setSelectedJenis] = useState<JenisDana | null>(null)
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [filteredWarga, setFilteredWarga] = useState<Warga[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasScheduleToday, setHasScheduleToday] = useState(false)
  const [scheduleInfo, setScheduleInfo] = useState<{
    todayName: string
    jadwalHari?: string
    namaKelompok?: string
  }>({ todayName: '' })
  const [formData, setFormData] = useState({
    selectedWarga: "",
    nominal: "",
    tanggalSelor: new Date().toISOString().split('T')[0],
  })
  
  const router = useRouter()

  // Nominal dalam kelipatan Rp 5.000
  const nominalOptions = [
    { value: "5000", label: "Rp 5.000" },
    { value: "10000", label: "Rp 10.000" },
    { value: "15000", label: "Rp 15.000" },
    { value: "20000", label: "Rp 20.000" },
    { value: "25000", label: "Rp 25.000" },
    { value: "30000", label: "Rp 30.000" },
    { value: "50000", label: "Rp 50.000" },
    { value: "custom", label: "Nominal Lain..." }
  ]

  useEffect(() => {
    // Cek login dan jenis dana yang dipilih
    const petugasData = localStorage.getItem("petugasLogin")
    const jenisData = localStorage.getItem("selectedJenisDana")
    const currentUserData = localStorage.getItem("currentUser")
    
    if (!petugasData) {
      router.push("/login-transaksi")
      return
    }

    if (!jenisData) {
      toast({
        title: "Jenis Dana Belum Dipilih",
        description: "Silakan pilih jenis dana terlebih dahulu",
        variant: "destructive",
      })
      router.push("/transaksi-dana")
      return
    }
    
    const parsedPetugas = JSON.parse(petugasData)
    const parsedUser = currentUserData ? JSON.parse(currentUserData) : null
    
    setPetugas(parsedPetugas)
    setSelectedJenis(JSON.parse(jenisData))
    setCurrentUser(parsedUser)
    
    // Cek jadwal petugas
    checkSchedule(parsedUser)
    
    fetchWarga()
  }, [router])
  
  const checkSchedule = async (user: any) => {
    try {
      // Admin dan super_admin selalu bisa akses
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
        setLoading(false)
        return
      }
      
      // Untuk petugas, cek jadwal
      if (user && user.role === 'petugas' && user.id) {
        const scheduleCheck = await checkPetugasScheduleToday(user.id)
        setHasScheduleToday(scheduleCheck.hasScheduleToday)
        setScheduleInfo({
          todayName: scheduleCheck.todayName,
          jadwalHari: scheduleCheck.jadwalHari || '',
          namaKelompok: scheduleCheck.namaKelompok || ''
        })
        setLoading(false)
      } else {
        // Fallback: bisa akses
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking schedule:', error)
      setHasScheduleToday(true)
      setScheduleInfo({ todayName: getTodayDayName() })
      setLoading(false)
    }
  }
  
  async function fetchWarga() {
    try {
      const data = await getKepalaKeluarga()
      const activeWarga = data.filter((w: Warga) => w.statusAktif === "Aktif")
      setWargaList(activeWarga)
      setFilteredWarga(activeWarga)
    } catch (error) {
      console.error("Error fetching warga:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data warga",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // Filter warga berdasarkan pencarian
    if (searchTerm.trim() === "") {
      setFilteredWarga(wargaList)
    } else {
      console.log({jadwal: currentUser && currentUser.role === 'petugas' && !hasScheduleToday})
      const filtered = wargaList.filter(warga =>
        warga.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warga.nik.includes(searchTerm)
      )
      setFilteredWarga(filtered)
    }
  }, [searchTerm, wargaList])

  const handleNominalChange = (value: string) => {
    if (value === "custom") {
      // Reset ke kosong untuk input custom
      setFormData({ ...formData, nominal: "" })
    } else {
      setFormData({ ...formData, nominal: value })
    }
  }

  const handleCustomNominalChange = (value: string) => {
    // Validasi hanya angka dan kelipatan 5000
    const numValue = parseInt(value)
    if (isNaN(numValue) || numValue < 0) {
      setFormData({ ...formData, nominal: "" })
      return
    }
    
    if (numValue % 5000 !== 0) {
      toast({
        title: "Nominal Tidak Valid",
        description: "Nominal harus kelipatan Rp 5.000",
        variant: "destructive",
      })
      return
    }
    
    setFormData({ ...formData, nominal: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.selectedWarga || !formData.nominal || !formData.tanggalSelor) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Semua field wajib diisi",
        variant: "destructive",
      })
      return
    }

    const nominal = parseInt(formData.nominal)
    if (nominal < 5000 || nominal % 5000 !== 0) {
      toast({
        title: "Nominal Tidak Valid",
        description: "Nominal harus minimal Rp 5.000 dan kelipatan Rp 5.000",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    
    try {
      const transaksiData = {
        id_warga: formData.selectedWarga,
        id_jenis_dana: selectedJenis!.id,
        id_user: petugas!.id,
        tanggal_setor: formData.tanggalSelor,
        nominal: nominal,
        status_jimpitan: "lunas"
      }

      const response = await apiClient.post(`/transaksi`, transaksiData)
      
      toast({
        title: "Transaksi Berhasil",
        description: `Transaksi sebesar ${formatCurrency(nominal)} berhasil disimpan`,
      })

      // Reset form
      setFormData({
        selectedWarga: "",
        nominal: "",
        tanggalSelor: new Date().toISOString().split('T')[0],
      })
      
    } catch (error) {
      console.error("Error creating transaksi:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan transaksi",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getSelectedWargaName = () => {
    const warga = wargaList.find(w => w.id === formData.selectedWarga)
    return warga ? warga.namaLengkap : ""
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  // Jika user adalah petugas dan tidak memiliki jadwal hari ini, tampilkan hanya notifikasi
  if (currentUser && currentUser.role === 'petugas' && !hasScheduleToday) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <div>
                <CardTitle className="text-xl">Input Manual Transaksi</CardTitle>
                <CardDescription>
                  Jenis Dana: <Badge className="ml-1">{selectedJenis?.namaDana}</Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Calendar className="h-5 w-5" />
              Tidak Ada Jadwal Ronda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-300 bg-orange-100">
              <Calendar className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <div className="font-semibold mb-2">Hari ini bukan jadwal ronda Anda. Anda tidak dapat menginputkan transaksi dana.</div>
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
                <div className="mt-3 text-sm">
                  <p>Hanya petugas yang bertugas pada hari ini yang dapat menginputkan transaksi dana.</p>
                  <p className="mt-1">Silakan hubungi admin jika ada kesalahan pada jadwal ronda Anda.</p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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
                <CardTitle className="text-xl">Input Manual Transaksi</CardTitle>
                <CardDescription>
                  Jenis Dana: <Badge className="ml-1">{selectedJenis?.namaDana}</Badge>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle>Form Transaksi</CardTitle>
          <CardDescription>
            Isi data transaksi dengan lengkap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pilih Warga */}
            <div className="space-y-3">
              <Label htmlFor="warga">Pilih Warga</Label>
              
              {/* Search Warga */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari nama warga atau NIK..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={formData.selectedWarga} onValueChange={(value) => setFormData({ ...formData, selectedWarga: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih warga" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {filteredWarga.map((warga) => (
                    <SelectItem key={warga.id} value={warga.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{warga.namaLengkap}</span>
                        <span className="text-xs text-muted-foreground">NIK: {warga.nik}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nominal */}
            <div className="space-y-3">
              <Label htmlFor="nominal">Nominal</Label>
              <Select value={formData.nominal} onValueChange={handleNominalChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih nominal" />
                </SelectTrigger>
                <SelectContent>
                  {nominalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Custom nominal input */}
              {(formData.nominal === "" || !nominalOptions.find(o => o.value === formData.nominal)) && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Masukkan nominal (kelipatan Rp 5.000)"
                    value={formData.nominal}
                    onChange={(e) => handleCustomNominalChange(e.target.value)}
                    step="5000"
                    min="5000"
                  />
                </div>
              )}
            </div>

            {/* Tanggal Setor */}
            <div className="space-y-3">
              <Label htmlFor="tanggal">Tanggal Setor</Label>
              <Input
                type="date"
                value={formData.tanggalSelor}
                onChange={(e) => setFormData({ ...formData, tanggalSelor: e.target.value })}
              />
            </div>

            {/* Summary */}
            {formData.selectedWarga && formData.nominal && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Ringkasan Transaksi:</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Warga:</span> {getSelectedWargaName()}</p>
                    <p><span className="font-medium">Jenis Dana:</span> {selectedJenis?.namaDana}</p>
                    <p><span className="font-medium">Nominal:</span> {formatCurrency(parseInt(formData.nominal))}</p>
                    <p><span className="font-medium">Tanggal:</span> {new Date(formData.tanggalSelor).toLocaleDateString('id-ID')}</p>
                    <p><span className="font-medium">Petugas:</span> {petugas?.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={saving || !formData.selectedWarga || !formData.nominal}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Transaksi
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
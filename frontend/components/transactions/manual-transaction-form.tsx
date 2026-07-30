"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { QrCode, User, Coins, Search } from "lucide-react"
import { getKepalaKeluarga, getAllJenisDana } from "@/lib/database"
import type { Warga, JenisDana } from "@/types/database"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface ManualTransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ManualTransactionForm({ isOpen, onClose, onSubmit }: ManualTransactionFormProps) {
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [jenisDanaList, setJenisDanaList] = useState<JenisDana[]>([])
  const [filteredWarga, setFilteredWarga] = useState<Warga[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [step, setStep] = useState<"pilih-jenis" | "input-manual" | "scan-barcode">("pilih-jenis")
  const [selectedJenis, setSelectedJenis] = useState<JenisDana | null>(null)
  const [formData, setFormData] = useState({
    selectedWarga: "",
    nominal: "",
    customNominal: "",
    tanggal: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (isOpen) {
      // Ambil user yang sudah login dari localStorage (sudah login di sistem utama)
      const userData = localStorage.getItem("currentUser")
      if (userData) {
        const user = JSON.parse(userData)
        setCurrentUser(user)
        setStep("pilih-jenis")
        fetchData()
      }
    } else {
      // Reset state saat dialog ditutup
      setStep("pilih-jenis")
      setSelectedJenis(null)
      setSearchTerm("")
      setShowDropdown(false)
      setFormData({
        selectedWarga: "",
        nominal: "",
        customNominal: "",
        tanggal: new Date().toISOString().split("T")[0],
      })
    }
  }, [isOpen])

  useEffect(() => {
    // Filter warga berdasarkan pencarian
    if (searchTerm.trim() === "") {
      setFilteredWarga(wargaList)
    } else {
      const filtered = wargaList.filter(warga =>
        warga.namaLengkap?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        warga.nik?.includes(searchTerm)
      )
      setFilteredWarga(filtered)
    }
  }, [searchTerm, wargaList])

  const fetchData = async () => {
    try {
      const [wargaData, jenisDanaData] = await Promise.all([
        apiClient.get<Warga[]>('/warga/kepala-keluarga').then(((response) => response.data)),
        apiClient.get<JenisDana[]>(`/jenis-dana`).then(((response) => response.data)),
      ])
      const activeWarga = wargaData!.filter((w: Warga) => w.statusAktif === "Aktif")
      const activeJenis = jenisDanaData!.filter((j: JenisDana) => j.isActive)
      
      setWargaList(activeWarga)
      setFilteredWarga(activeWarga)
      setJenisDanaList(activeJenis)
    } catch (error) {
      console.error("Gagal memuat data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      })
    }
  }

  const handleSelectJenis = (jenis: JenisDana) => {
    setSelectedJenis(jenis)
    setStep("input-manual")
  }

  const handleScanBarcode = () => {
    setStep("scan-barcode")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.selectedWarga || !formData.customNominal) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Warga dan nominal wajib diisi",
        variant: "destructive",
      })
      return
    }

    const nominal = parseInt(formData.customNominal)
    
    if (isNaN(nominal) || nominal < 0) {
      toast({
        title: "Nominal Tidak Valid",
        description: "Nominal harus berupa angka dan lebih dari 0",
        variant: "destructive",
      })
      return
    }

    onSubmit({
      id_warga: formData.selectedWarga,
      id_jenis_dana: selectedJenis!.id,
      id_user: currentUser?.id || currentUser?.id_petugas,
      nominal: nominal,
      tanggal_setor: formData.tanggal,
      status_jimpitan: "lunas",
    })

    // Reset form
    setStep("pilih-jenis")
    setSelectedJenis(null)
    setSearchTerm("")
    setShowDropdown(false)
    setFormData({
      selectedWarga: "",
      nominal: "",
      customNominal: "",
      tanggal: new Date().toISOString().split("T")[0],
    })
    
    toast({
      title: "Berhasil",
      description: "Transaksi berhasil disimpan",
    })
  }

  const getUserName = () => {
    if (!currentUser) return "User"
    return currentUser.nama || currentUser.namaLengkap || currentUser.username || "User"
  }

  const renderContent = () => {
    switch (step) {
      case "pilih-jenis":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Coins className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-sm text-gray-600">Pilih jenis dana untuk transaksi</p>
              <p className="text-xs text-gray-500 mt-1">User: {getUserName()}</p>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {jenisDanaList.map((jenis, index) => (
                <div
                  key={jenis.id + "_" + index}
                  className="p-3 border rounded-lg cursor-pointer hover:border-primary/30 hover:bg-primary/10 transition-all"
                  onClick={() => handleSelectJenis(jenis)}
                >
                  <h3 className="font-medium">{jenis.namaDana}</h3>
                  <p className="text-sm text-gray-600">{jenis.deskripsi}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleScanBarcode} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Scan Barcode
              </Button>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Tutup</Button>
            </DialogFooter>
          </div>
        )

      case "scan-barcode":
        return (
          <div className="space-y-4 text-center">
            <QrCode className="h-16 w-16 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium">Scan Barcode Rumah</h3>
            <p className="text-sm text-gray-600">
              Fitur scan barcode sedang dalam pengembangan.<br/>
              Silakan gunakan input manual untuk sementara.
            </p>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("pilih-jenis")}>Kembali</Button>
              <Button onClick={() => setStep("input-manual")}>Input Manual</Button>
            </DialogFooter>
          </div>
        )

      case "input-manual":
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-sm text-muted-foreground text-center">
              Isi data transaksi secara manual
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-medium">Jenis Dana:</span>
                <Badge variant="default">
                  {selectedJenis?.namaDana}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">User: {getUserName()}</p>
            </div>

            {/* Cari dan Pilih Warga */}
            <div className="space-y-2">
              <Label htmlFor="warga">Cari dan Pilih Warga</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                <Input
                  placeholder="Cari nama warga atau NIK..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    // Delay untuk memberi waktu onClick pada list item
                    setTimeout(() => setShowDropdown(false), 200)
                  }}
                  className="pl-10"
                />
              </div>
              
              {showDropdown && formData.selectedWarga === "" && (
                <div className="border rounded-md max-h-60 overflow-y-auto bg-background shadow-lg">
                  {filteredWarga.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Tidak ada warga ditemukan
                    </div>
                  ) : (
                    filteredWarga.map((warga,index) => (
                      <div
                        key={warga.id + "_" +  index}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          setFormData({ ...formData, selectedWarga: warga.id })
                          setSearchTerm(warga.namaLengkap)
                          setShowDropdown(false)
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{warga.namaLengkap}</span>
                          <span className="text-xs text-muted-foreground">NIK: {warga.nik}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Input Nominal Manual */}
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="Masukkan nominal (contoh: 5000)"
                value={formData.customNominal}
                onChange={(e) => setFormData({ ...formData, customNominal: e.target.value })}
                min="0"
                step="500"
                required
              />
              <p className="text-xs text-muted-foreground">
                Masukkan jumlah nominal transaksi
              </p>
            </div>

            {/* Tanggal Setor */}
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Setor</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("pilih-jenis")}>
                Kembali
              </Button>
              <Button type="submit">
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        )

      default:
        return null
    }
  }

  const getDialogTitle = () => {
    switch (step) {
      case "pilih-jenis": return "Pilih Jenis Dana"
      case "scan-barcode": return "Scan Barcode"
      case "input-manual": return "Input Manual Transaksi"
      default: return "Transaksi Dana"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {step === "pilih-jenis" && "Pilih jenis dana untuk transaksi"}
            {step === "scan-barcode" && "Scan barcode rumah untuk input otomatis"}
            {step === "input-manual" && "Isi data transaksi secara manual"}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

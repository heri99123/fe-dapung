"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WargaForm } from "@/components/forms/warga-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Eye, Edit, Trash2, Phone, MapPin } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { wargaApi } from "@/lib/api"
import type { Warga } from "@/types/database"

export default function DataWargaPage() {
  const [warga, setWarga] = useState<Warga[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const fetchWarga = async () => {
    try {
      const response = await wargaApi.getAll()
      if (response.success && response.data) {
        setWarga(response.data as Warga[])
      }
    } catch (error) {
      console.error("[v0] Error fetching warga:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data warga",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarga()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchWarga()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredWarga = warga.filter(
    (w) =>
      w.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.alamatRumah?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreate = () => {
    setFormMode("create")
    setSelectedWarga(null)
    setShowForm(true)
  }

  const handleDetail = (warga: Warga) => {
    setSelectedWarga(warga)
    setShowDetailDialog(true)
  }

  const handleEdit = (warga: Warga) => {
    setFormMode("edit")
    setSelectedWarga(warga)
    setShowForm(true)
  }

  const handleDelete = (warga: Warga) => {
    setWargaToDelete(warga)
    setShowDeleteDialog(true)
  }

  const handleFormSubmit = async (data: Omit<Warga, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log("[v0] Data yang akan dikirim:", data)
      
      if (formMode === "create") {
        const response = await wargaApi.create(data)
        console.log("[v0] Response dari create:", response)
        if (response.success) {
          toast({
            title: "Berhasil",
            description: "Data warga berhasil ditambahkan",
          })
        }
      } else if (selectedWarga) {
        const response = await wargaApi.update(selectedWarga.id, data)
        console.log("[v0] Response dari update:", response)
        if (response.success) {
          toast({
            title: "Berhasil",
            description: "Data warga berhasil diperbarui",
          })
        }
      }
      await fetchWarga()
      setShowForm(false)
    } catch (error) {
      console.error("[v0] Error di handleFormSubmit:", error)
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan data warga"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (wargaToDelete) {
      try {
        const response = await wargaApi.delete(wargaToDelete.id)
        if (response.success) {
          toast({
            title: "Berhasil",
            description: "Data warga berhasil dihapus",
          })
          await fetchWarga()
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus data warga",
          variant: "destructive",
        })
      }
    }
    setShowDeleteDialog(false)
    setWargaToDelete(null)
  }

  if (loading) {
    return (
      <DashboardLayout title="Data Warga">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading data warga...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Data Warga">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau alamat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:w-64 md:w-80"
              />
            </div>
          </div>
          <div className="flex w-full sm:w-auto flex-wrap gap-2">
            <Button onClick={handleCreate} className="flex-1 sm:flex-none flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Warga
            </Button>
          </div>
        </div>

        {/* Warga Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Warga</CardTitle>
            <CardDescription>
              Menampilkan {filteredWarga.length} dari {warga.length} warga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWarga.map((w) => (
                <Card key={w.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                          {w.namaLengkap
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{w.namaLengkap}</h3>
                          <p className="text-sm text-muted-foreground">{w.jenisKelamin}</p>
                        </div>
                      </div>
                      <Badge
                        variant={w.statusAktif === "Aktif" ? "default" : "secondary"}
                      >
                        {w.statusAktif}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{w.alamatRumah}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleDetail(w)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleEdit(w)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(w)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredWarga.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada data warga yang ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WargaForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedWarga}
        mode={formMode}
      />

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Warga</DialogTitle>
            <DialogDescription>Informasi lengkap warga</DialogDescription>
          </DialogHeader>
          {selectedWarga && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`/.jpg?key=ba20p&height=64&width=64&query=${selectedWarga.namaLengkap}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {selectedWarga.namaLengkap
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedWarga.namaLengkap}</h3>
                    <p className="text-muted-foreground">{selectedWarga.jenisKelamin}</p>
                  </div>
                </div>
                <Badge
                  variant={selectedWarga.statusAktif === "Aktif" ? "default" : "secondary"}
                >
                  {selectedWarga.statusAktif}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nomor HP</p>
                    <p className="font-medium">{selectedWarga.nomorHp}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Alamat</p>
                    <p className="font-medium">{selectedWarga.alamatRumah}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">NIK:</span>
                    <span className="font-medium font-mono">{selectedWarga.nik}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Jenis Kelamin:</span>
                    <span className="font-medium">{selectedWarga.jenisKelamin}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className="font-medium">{selectedWarga.statusAktif}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setShowDetailDialog(false)
                if (selectedWarga) handleEdit(selectedWarga)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Warga</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data warga "{wargaToDelete?.namaLengkap}"? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

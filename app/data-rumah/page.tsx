"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BarcodeGenerator } from "@/components/barcode/barcode-generator"
import { RumahForm } from "@/components/forms/rumah-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, QrCode, Eye, Users } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { getAllRumah, getRumahById, createRumah, updateRumah, deleteRumah } from "@/lib/database"
import type { Rumah } from "@/types/database"

export default function DataRumahPage() {
  const [rumah, setRumah] = useState<Rumah[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [selectedRumah, setSelectedRumah] = useState<Rumah | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [rumahToDelete, setRumahToDelete] = useState<Rumah | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [rumahDetail, setRumahDetail] = useState<Rumah | null>(null)

  const fetchRumah = async () => {
    try {
      const data = await getAllRumah()
      setRumah(data)
    } catch (error) {
      console.error("Error fetching rumah:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data rumah",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRumah()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchRumah()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredRumah = rumah.filter(
    (r) =>
      r.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rt.toString().includes(searchTerm) ||
      r.rw.toString().includes(searchTerm) ||
      (r.kodeBarcode && r.kodeBarcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.kepalaKeluarga && r.kepalaKeluarga.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const wargaDetail = useMemo(() => {
    if (!rumahDetail) return []
    return rumahDetail.penghuni || []
  }, [rumahDetail])

  const handleCreate = () => {
    setFormMode("create")
    setSelectedRumah(null)
    setShowForm(true)
  }

  const handleEdit = (rumah: Rumah) => {
    setFormMode("edit")
    setSelectedRumah(rumah)
    setShowForm(true)
  }

  const handleDelete = (rumah: Rumah) => {
    setRumahToDelete(rumah)
    setShowDeleteDialog(true)
  }

  const handleShowDetail = async (rumah: Rumah) => {
    try {
      // Ambil detail rumah dengan daftar penghuni
      const detailData = await getRumahById(rumah.id)
      setRumahDetail(detailData)
      setShowDetailDialog(true)
    } catch (error) {
      console.error("Error fetching rumah detail:", error)
      toast({
        title: "Error",
        description: "Gagal memuat detail rumah",
        variant: "destructive",
      })
    }
  }

  const handleFormSubmit = async (data: Omit<Rumah, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (formMode === "create") {
        await createRumah(data)
        toast({
          title: "Berhasil",
          description: "Data rumah berhasil ditambahkan",
        })
      } else if (selectedRumah) {
        await updateRumah(selectedRumah.id, data)
        toast({
          title: "Berhasil",
          description: "Data rumah berhasil diperbarui",
        })
      }

      await fetchRumah()
      setShowForm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data rumah",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = async () => {
    if (rumahToDelete) {
      try {
        await deleteRumah(rumahToDelete.id)
        toast({
          title: "Berhasil",
          description: "Data rumah berhasil dihapus",
        })
        await fetchRumah()
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus data rumah",
          variant: "destructive",
        })
      }
    }
    setShowDeleteDialog(false)
    setRumahToDelete(null)
  }

  if (loading) {
    return (
      <DashboardLayout title="Data Rumah">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading data rumah...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Data Rumah">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari alamat, RT/RW, atau kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:w-64 md:w-80"
              />
            </div>
          </div>
          <div className="flex w-full sm:w-auto flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBarcodeGenerator(!showBarcodeGenerator)}
              className="flex-1 sm:flex-none flex items-center gap-2 bg-transparent"
            >
              <QrCode className="h-4 w-4" />
              {showBarcodeGenerator ? "Sembunyikan" : "Generate"} Barcode
            </Button>
            <Button onClick={handleCreate} className="flex-1 sm:flex-none flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Rumah
            </Button>
          </div>
        </div>

        {/* Barcode Generator */}
        {showBarcodeGenerator && <BarcodeGenerator rumah={rumah} />}

        {/* Rumah List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Rumah</CardTitle>
            <CardDescription>
              Menampilkan {filteredRumah.length} dari {rumah.length} rumah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRumah.map((r) => (
                <Card key={r.id} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-card-foreground text-pretty mb-2">
                            {r.kepalaKeluarga || "Belum Ada Kepala Keluarga"}
                          </h3>
                          <p className="text-sm font-medium text-muted-foreground mb-2">{r.alamat}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">RT {r.rt || "-"}</Badge>
                            <Badge variant="outline">RW {r.rw || "-"}</Badge>
                            <Badge variant="outline">
                              {r.statusKepemilikan === "Kontrak" ? "Kontrakan" : r.statusKepemilikan}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Jumlah Anggota:
                          </span>
                          <Badge variant="secondary" className="font-medium">
                            {r.jumlahPenghuni || 0} orang
                          </Badge>
                        </div>
                        {r.kodeBarcode && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <QrCode className="h-4 w-4" />
                              Kode Barcode:
                            </span>
                            <span className="font-mono text-xs bg-background px-2 py-1 rounded">{r.kodeBarcode}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleShowDetail(r)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleEdit(r)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive bg-transparent"
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRumah.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada data rumah yang ditemukan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RumahForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedRumah}
        mode={formMode}
      />

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detail Anggota Keluarga
            </DialogTitle>
            <DialogDescription>
              {rumahDetail?.alamat} - RT {rumahDetail?.rt} / RW {rumahDetail?.rw}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-medium">Total Anggota Keluarga</span>
              <Badge variant="secondary">{wargaDetail.length} orang</Badge>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {wargaDetail.length > 0 ? (
                wargaDetail.map((w, idx) => (
                  <div key={w.idWarga} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-card-foreground">{w.namaLengkap || w.namaLengkap}</p>
                        {w.namaLengkap === rumahDetail?.kepalaKeluarga && (
                          <Badge variant="default" className="text-xs">
                            Kepala Keluarga
                          </Badge>
                        )}

                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <p>NIK: {w.nik}</p>
                        <p>{w.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada anggota keluarga terdaftar</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Rumah</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data rumah "{rumahToDelete?.alamat}"? Tindakan ini tidak dapat
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

"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { getAllJenisDana, createJenisDana, updateJenisDana, deleteJenisDana } from "@/lib/database"
import type { JenisDana } from "@/types/database"

type JenisDanaFormData = {
  namaDana: string
  deskripsi: string
  isActive: boolean
}

export default function JenisDanaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedJenis, setSelectedJenis] = useState<JenisDana | null>(null)
  const [jenisDana, setJenisDana] = useState<JenisDana[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [jenisDanaToDelete, setJenisDanaToDelete] = useState<JenisDana | null>(null)

  const [formData, setFormData] = useState<JenisDanaFormData>({
    namaDana: "",
    deskripsi: "",
    isActive: true,
  })

  // 🔹 Fetch data awal
  useEffect(() => {
    fetchJenisDana()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchJenisDana()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchJenisDana = async () => {
    try {
      setLoading(true)
      const data = await getAllJenisDana()
      setJenisDana(data || [])
    } catch (error) {
      console.error("Gagal memuat data jenis dana:", error)
    } finally {
      setLoading(false)
    }
  }
  const filteredJenis = jenisDana.filter(
    (j) =>
      j.namaDana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAdd = async () => {
    try {
      const jenisDanaData: Omit<JenisDana, "id" | "createdAt" | "updatedAt"> = {
        namaDana: formData.namaDana,
        deskripsi: formData.deskripsi,
        isActive: formData.isActive,
      }
      await createJenisDana(jenisDanaData)
      await fetchJenisDana() // Refresh data setelah create
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error adding jenis dana:", error)
      alert("Gagal menambahkan jenis dana!")
    }
  }

  const handleEdit = (jenis: JenisDana) => {
    setSelectedJenis(jenis)
    setFormData({
      namaDana: jenis.namaDana || "",
      deskripsi: jenis.deskripsi || "",
      isActive: jenis.isActive ?? true,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (selectedJenis) {
      try {
        const jenisDanaData: Partial<JenisDana> = {
          namaDana: formData.namaDana,
          deskripsi: formData.deskripsi,
          isActive: formData.isActive,
        }
        await updateJenisDana(selectedJenis.id, jenisDanaData)
        await fetchJenisDana() // Refresh data setelah update
        setIsEditDialogOpen(false)
        resetForm()
      } catch (error) {
        console.error("Error updating jenis dana:", error)
        alert("Gagal memperbarui jenis dana!")
      }
    }
  }

  const handleDelete = (jenis: JenisDana) => {
    setJenisDanaToDelete(jenis)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (jenisDanaToDelete) {
      try {
        await deleteJenisDana(jenisDanaToDelete.id)
        await fetchJenisDana() // Refresh data setelah delete
      } catch (error) {
        console.error("Error deleting jenis dana:", error)
        alert("Gagal menghapus jenis dana!")
      }
    }
    setShowDeleteDialog(false)
    setJenisDanaToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      namaDana: "",
      deskripsi: "",
      isActive: true,
    })
    setSelectedJenis(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout title="Jenis Dana">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari jenis dana..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 md:w-80"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jenis Dana
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Jenis Dana Baru</DialogTitle>
              <DialogDescription>Masukkan informasi jenis dana baru</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="namaDana" className="sm:text-right">
                  Nama Jenis
                </Label>
                <Input
                  id="namaDana"
                  value={formData.namaDana}
                  onChange={(e) => setFormData({ ...formData, namaDana: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="Contoh: Jimpitan Harian"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="deskripsi" className="sm:text-right">
                  Deskripsi
                </Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="sm:col-span-3"
                  placeholder="Deskripsi jenis dana..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="sm:text-right">
                  Status
                </Label>
                <Select
                  value={formData.isActive ? "aktif" : "nonaktif"}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === "aktif" })}
                >
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAdd}>
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jenis Dana</CardTitle>
          <CardDescription>Total {filteredJenis.length} jenis dana terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJenis.map((jenis) => (
              <div key={jenis.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground mb-1">{jenis.namaDana}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{jenis.deskripsi}</p>
                  </div>
                  <Badge variant={jenis.isActive ? "default" : "secondary"}>
                    {jenis.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleEdit(jenis)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDelete(jenis)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Jenis Dana</DialogTitle>
            <DialogDescription>Ubah informasi jenis dana</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_namaDana" className="sm:text-right">
                Nama Jenis
              </Label>
              <Input
                id="edit_namaDana"
                value={formData.namaDana}
                onChange={(e) => setFormData({ ...formData, namaDana: e.target.value })}
                className="sm:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_deskripsi" className="sm:text-right">
                Deskripsi
              </Label>
              <Textarea
                id="edit_deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="sm:col-span-3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_isActive" className="sm:text-right">
                Status
              </Label>
              <Select
                value={formData.isActive ? "aktif" : "nonaktif"}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === "aktif" })}
              >
                <SelectTrigger className="sm:col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdate}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jenis Dana</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jenis dana "{jenisDanaToDelete?.namaDana}"? Tindakan ini tidak dapat
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

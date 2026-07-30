"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { getAllPetugas, createPetugas, updatePetugas, deletePetugas, getAllKelompokRonda } from "@/lib/database"
import { PetugasForm } from "@/components/forms/petugas-form"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"

export default function DataPetugasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPetugas, setSelectedPetugas] = useState<User | null>(null)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [kelompokRondaList, setKelompokRondaList] = useState<any[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [petugasToDelete, setPetugasToDelete] = useState<User | null>(null)

  const [petugas, setPetugas] = useState<User[]>([])

  const fetchPetugas = async () => {
    try {
      console.log("🔄 Fetching petugas data...")
      const data = await getAllPetugas()
      console.log("✅ Received petugas data:", data.length, "items")
      
      const mappedData = (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        statusUser: item.status?.toLowerCase() === "aktif",
        namaLengkap: item.namaWarga || item.namaLengkap || "Tidak diketahui",
      }))

      // Log specific users untuk debugging
      const adminUsers = mappedData.filter((p: any) => 
        ['Superadmin1', 'Admin13'].includes(p.username)
      )
      console.log("🔍 Admin users in frontend:", adminUsers.map((u: any) => ({
        username: u.username,
        role: u.role,
        namaLengkap: u.namaLengkap
      })))

      setPetugas(mappedData)
    } catch (err) {
      console.error("Gagal memuat data petugas:", err)
      setPetugas([])
    }
  }

  const fetchKelompokRonda = async () => {
    try {
      const data = await getAllKelompokRonda()
      setKelompokRondaList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Gagal memuat kelompok ronda:", err)
    }
  }

  useEffect(() => {
    console.log("🚀 Component mounted, fetching data...")
    fetchPetugas()
    fetchKelompokRonda()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPetugas()
        fetchKelompokRonda()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredPetugas = petugas.filter(
    (p) =>
      p.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getKelompokRondaName = (kelompokId: string) => {
    const kelompok = kelompokRondaList.find((k) => k.id === kelompokId)
    return kelompok ? kelompok.namaKelompok : "Tidak ada"
  }

  const handleCreate = () => {
    setFormMode("create")
    setSelectedPetugas(null)
    setIsAddDialogOpen(true)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === "create") {
        await apiClient.post(`/petugas`, data)
        toast({
          title: "Berhasil",
          description: "Petugas berhasil ditambahkan",
        })
      } else if (selectedPetugas) {
        await apiClient.put(`/petugas/${selectedPetugas.id}`, data)
        toast({
          title: "Berhasil",
          description: "Data petugas berhasil diperbarui",
        })
      }

      await fetchPetugas()
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data petugas",
        variant: "destructive",
      })
    }
  }

  const handleDetail = (petugas: User) => {
    setSelectedPetugas(petugas)
    setIsDetailDialogOpen(true)
  }

  const handleEdit = (petugas: User) => {
    setFormMode("edit")
    setSelectedPetugas(petugas)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (petugas: User) => {
    setPetugasToDelete(petugas)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (petugasToDelete) {
      try {
        await deletePetugas(petugasToDelete.id)
        toast({
          title: "Berhasil",
          description: "Petugas berhasil dihapus",
        })
        await fetchPetugas()
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus petugas",
          variant: "destructive",
        })
      }
    }
    setShowDeleteDialog(false)
    setPetugasToDelete(null)
  }

  return (
    <DashboardLayout title="Data Petugas">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="relative w-full sm:w-auto mb-3 sm:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Cari nama, username, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64 md:w-80"
          />
        </div>

        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Petugas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Petugas</CardTitle>
          <CardDescription>Total {filteredPetugas.length} petugas terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPetugas.map((petugas) => (
              <div key={petugas.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`/abstract-geometric-shapes.png?height=48&width=48&query=${petugas.namaLengkap}`}
                      />
                      <AvatarFallback >
                        {(petugas.namaLengkap ?? petugas.username ?? "P")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{petugas.namaLengkap}</h3>
                      <p className="text-sm text-muted-foreground">{petugas.jabatan ?? "N/A"}</p>
                    </div>
                  </div>
                  <Badge
                    variant={petugas.statusUser ? "default" : "secondary"}
                  >
                    {petugas.statusUser ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {/* Tidak menampilkan username/kode petugas dan kelompok di card list */}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleDetail(petugas)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handleEdit(petugas)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    onClick={() => handleDelete(petugas)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Petugas</DialogTitle>
            <DialogDescription>Informasi lengkap petugas</DialogDescription>
          </DialogHeader>
          {selectedPetugas && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`/.jpg?key=9afnj&height=64&width=64&query=${selectedPetugas.namaLengkap}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {(selectedPetugas?.namaLengkap ?? selectedPetugas?.username ?? "P")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{selectedPetugas.namaLengkap}</h3>
                    <p className="text-muted-foreground">{selectedPetugas.jabatan ?? "N/A"}</p>
                  </div>
                </div>
                <Badge
                  variant={selectedPetugas.statusUser ? "default" : "secondary"}
                  className="bg-primary text-white"
                >
                  {selectedPetugas.statusUser ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <span className="font-medium">{selectedPetugas.username ?? "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Jabatan:</span>
                  <span className="font-medium">{selectedPetugas.jabatan ?? "N/A"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">
                    {(() => {
                      const roleStr = String(selectedPetugas.role || '').toLowerCase();
                      if (roleStr === 'superadmin' || roleStr === 'super_admin') return 'Super Admin';
                      if (roleStr === 'admin') return 'Admin';
                      if (roleStr === 'petugas') return 'Petugas';
                      if (roleStr === 'warga') return 'Warga';
                      // Fallback - tampilkan as-is dari backend
                      return selectedPetugas.role || 'Petugas';
                    })()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kelompok Ronda:</span>
                  <span className="font-medium">
                    {(() => {
                      const namaKelompok = (selectedPetugas as any).namaKelompok || "Tidak ada";
                      const jadwalHari = (selectedPetugas as any).jadwalHari;
                      
                      if (!jadwalHari) return namaKelompok;
                      
                      // Jika jadwal hari sama dengan nama kelompok (misal: "Sabtu"), 
                      // atau jika nama kelompok sudah mengandung jadwal hari, tampilkan nama kelompok saja
                      if (namaKelompok.toLowerCase().includes(jadwalHari.toLowerCase()) || 
                          jadwalHari.toLowerCase() === namaKelompok.toLowerCase()) {
                        return namaKelompok;
                      }
                      
                      return `${namaKelompok} (${jadwalHari})`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsDetailDialogOpen(false)
                if (selectedPetugas) handleEdit(selectedPetugas)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PetugasForm
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={null}
        mode="create"
      />

      <PetugasForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedPetugas}
        mode="edit"
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Petugas</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data petugas "{petugasToDelete?.namaLengkap}"? Tindakan ini tidak dapat
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

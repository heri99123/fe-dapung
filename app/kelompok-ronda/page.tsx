"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Search, Plus, Edit, Trash2, Users, ChevronDown, ChevronUp, CalendarDays } from "lucide-react"
import {
  getAllKelompokRonda,
  createKelompokRonda,
  updateKelompokRonda,
  deleteKelompokRonda,
  getAnggotaByKelompokId,
} from "@/lib/database"
import { KelompokRondaInfo } from "@/components/ronda/kelompok-ronda-info"
import type { KelompokRonda, User } from "@/types/database"
import { apiClient } from "@/lib/api"

export default function KelompokRondaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedKelompok, setSelectedKelompok] = useState<KelompokRonda | null>(null)
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({})
  const [membersByKelompok, setMembersByKelompok] = useState<Record<string, any[]>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [kelompokToDelete, setKelompokToDelete] = useState<KelompokRonda | null>(null)
  const [formData, setFormData] = useState({
    namaKelompok: "",
    keteranganKelompok: "",
  })
  const [kelompokRonda, setKelompokRonda] = useState<KelompokRonda[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    // Get current user from localStorage
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

async function fetchKelompokRonda() {
  try {
    const data = await getAllKelompokRonda()
    setKelompokRonda(Array.isArray(data) ? data : [])

    if (Array.isArray(data)) {
      const membersData: Record<string, any[]> = {}
      for (const kelompok of data) {
        try {
          const members = await getAnggotaByKelompokId(kelompok.id)
          membersData[kelompok.id] = Array.isArray(members) ? members : []
        } catch (error) {
          console.error(`Gagal memuat anggota kelompok ${kelompok.id}:`, error)
          membersData[kelompok.id] = []
        }
      }
      setMembersByKelompok(membersData)
    }
  } catch (error) {
    console.error("Gagal memuat data kelompok ronda:", error)
    setKelompokRonda([])
  }
}

  useEffect(() => {

    fetchKelompokRonda()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchKelompokRonda()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredKelompok = kelompokRonda.filter(
    (k) =>
      k.namaKelompok.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keteranganKelompok.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAdd = async () => {
    await apiClient.post(`/kelompok-ronda`,formData)
    setIsAddDialogOpen(false)
    resetForm()
    fetchKelompokRonda()
    // window.location.reload()
  }

  const handleEdit = (kelompok: KelompokRonda) => {
    setSelectedKelompok(kelompok)
    setFormData({
      namaKelompok: kelompok.namaKelompok,
      keteranganKelompok: kelompok.keteranganKelompok,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (selectedKelompok) {
      await updateKelompokRonda(selectedKelompok.id, formData)
      setIsEditDialogOpen(false)
      resetForm()
      fetchKelompokRonda()
      // window.location.reload()
    }
  }

  const handleDelete = (kelompok: KelompokRonda) => {
    setKelompokToDelete(kelompok)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (kelompokToDelete) {
      await deleteKelompokRonda(kelompokToDelete.id)
      fetchKelompokRonda()
      // window.location.reload()
    }
  }

  const resetForm = () => {
    setFormData({
      namaKelompok: "",
      keteranganKelompok: "",
    })
    setSelectedKelompok(null)
  }

  const getMembers = (kelompokId: string) => {
    const members = membersByKelompok[kelompokId] || []
    return members.length > 0 ? members.map((m) => m.namaLengkap || m.username || "Unknown") : []
  }

  const toggleMemberExpansion = (kelompokId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [kelompokId]: !prev[kelompokId],
    }))
  }

  return (
    <DashboardLayout title="Kelompok Ronda">
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="info" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Informasi Absensi</span>
            <span className="sm:hidden">Absensi</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Kelola Kelompok</span>
            <span className="sm:hidden">Kelola</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <KelompokRondaInfo userRole={currentUser?.role || "admin"} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Search + Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari kelompok ronda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 md:w-80"
              />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kelompok
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Kelompok Ronda Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi kelompok ronda baru (Contoh: Kelompok A)</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="namaKelompok" className="sm:text-right">
                      Nama Kelompok
                    </Label>
                    <Input
                      id="namaKelompok"
                      value={formData.namaKelompok}
                      onChange={(e) => setFormData({ ...formData, namaKelompok: e.target.value })}
                      className="sm:col-span-3"
                      placeholder="Contoh: Kelompok A"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="keteranganKelompok" className="sm:text-right">
                      Keterangan
                    </Label>
                    <Textarea
                      id="keteranganKelompok"
                      value={formData.keteranganKelompok}
                      onChange={(e) => setFormData({ ...formData, keteranganKelompok: e.target.value })}
                      className="sm:col-span-3"
                      placeholder="Deskripsi kelompok ronda..."
                    />
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

          {/* List Kelompok */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Daftar Kelompok Ronda</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Total {filteredKelompok.length} kelompok ronda terdaftar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredKelompok.map((kelompok) => {
                  const members = getMembers(kelompok.id)
                  const isExpanded = expandedMembers[kelompok.id]

                  return (
                    <div key={kelompok.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base truncate">{kelompok.namaKelompok}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{kelompok.keteranganKelompok}</p>
                        </div>
                        <Badge className="ml-2 flex-shrink-0 text-xs">Aktif</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <button
                          onClick={() => toggleMemberExpansion(kelompok.id)}
                          className="w-full flex items-center justify-between text-xs sm:text-sm text-muted-foreground hover:text-card-foreground transition-colors py-1"
                        >
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{members.length} Anggota</span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="ml-6 mt-2 space-y-1 bg-gray-50 rounded-md p-2 sm:p-3">
                            {members.length > 0 ? (
                              members.map((member, index) => (
                                <div key={index} className="text-xs sm:text-sm text-gray-700 flex items-center">
                                  <span className="w-5 sm:w-6 text-muted-foreground flex-shrink-0">{index + 1}.</span>
                                  <span className="truncate">{member}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs sm:text-sm text-muted-foreground italic">Belum ada anggota</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent text-xs sm:text-sm"
                          onClick={() => handleEdit(kelompok)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent px-2 sm:px-3"
                          onClick={() => handleDelete(kelompok)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Kelompok Ronda</DialogTitle>
            <DialogDescription>Ubah informasi kelompok ronda</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_namaKelompok" className="sm:text-right">
                Nama Kelompok
              </Label>
              <Input
                id="edit_namaKelompok"
                value={formData.namaKelompok}
                onChange={(e) => setFormData({ ...formData, namaKelompok: e.target.value })}
                className="sm:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_keteranganKelompok" className="sm:text-right">
                Keterangan
              </Label>
              <Textarea
                id="edit_keteranganKelompok"
                value={formData.keteranganKelompok}
                onChange={(e) => setFormData({ ...formData, keteranganKelompok: e.target.value })}
                className="sm:col-span-3"
              />
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
            <AlertDialogTitle>Hapus Kelompok Ronda</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kelompok ronda "{kelompokToDelete?.namaKelompok}"? Tindakan ini tidak
              dapat dibatalkan.
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

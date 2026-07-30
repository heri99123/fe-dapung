"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getAllWarga, getAllKelompokRonda } from "@/lib/database"
import type { User, Warga, KelompokRonda } from "@/types/database"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

interface PetugasFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: User | null
  mode: "create" | "edit"
}

export function PetugasForm({ isOpen, onClose, onSubmit, initialData, mode }: PetugasFormProps) {
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [kelompokRondaList, setKelompokRondaList] = useState<KelompokRonda[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    idWarga: "",
    idKelompokRonda: "",
    username: "",
    password: "",
    jabatan: "",
    status: "aktif" as "aktif" | "nonaktif",
    role: "petugas" as "petugas" | "admin" | "super_admin",
  })

  useEffect(() => {
    const fetchWarga = async () => {
      try {
        const data = await getAllWarga()
        const activeWarga = Array.isArray(data) ? data.filter((w) => w.statusAktif === "Aktif") : []
        setWargaList(activeWarga)
        const kelompokData = await getAllKelompokRonda()
        setKelompokRondaList(Array.isArray(kelompokData) ? kelompokData : [])
      } catch (error) {
        console.error("Gagal memuat data warga:", error)
        toast({
          title: "Error",
          description: "Gagal memuat data warga",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchWarga()
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData && mode === "edit") {
      // Convert role from backend format to frontend format
      const roleFromBackend = String(initialData.role || 'petugas').toLowerCase()
      let frontendRole: "petugas" | "admin" | "super_admin" = "petugas"
      
      if (roleFromBackend === 'superadmin' || roleFromBackend === 'super_admin') {
        frontendRole = 'super_admin'
      } else if (roleFromBackend === 'admin') {
        frontendRole = 'admin'
      } else {
        frontendRole = 'petugas'
      }

      console.log("📝 Loading initial data for edit:", {
        backendRole: initialData.role,
        convertedRole: frontendRole
      })

      setFormData({
        idWarga: (initialData as any).idWarga || (initialData as any).id_warga || "",
        idKelompokRonda: (initialData as any).kelompokId || (initialData as any).id_kelompok_ronda || "",
        username: initialData.username || "",
        password: "",
        jabatan: initialData.jabatan || "",
        status: initialData.statusUser ? "aktif" : "nonaktif",
        role: frontendRole,
      })
    } else {
      setFormData({
        idWarga: "",
        idKelompokRonda: "",
        username: "",
        password: "",
        jabatan: "",
        status: "aktif",
        role: "petugas",
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === "create" && !formData.idWarga) {
      toast({
        title: "Error",
        description: "Silakan pilih warga terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    if (!formData.username) {
      toast({
        title: "Error",
        description: "Username wajib diisi",
        variant: "destructive",
      })
      return
    }

    if (mode === "create" && !formData.password) {
      toast({
        title: "Error",
        description: "Password wajib diisi",
        variant: "destructive",
      })
      return
    }

    if (!formData.jabatan) {
      toast({
        title: "Error",
        description: "Jabatan wajib diisi",
        variant: "destructive",
      })
      return
    }

    // Convert role from frontend format to backend format
    const roleMapping: Record<string, string> = {
      'petugas': 'Petugas',
      'admin': 'Admin',
      'super_admin': 'SuperAdmin'
    }

    const payload = {
      ...formData,
      role: roleMapping[formData.role] || 'Petugas', // Convert to backend format
      statusUser: formData.status === "aktif",
      kelompokId: formData.idKelompokRonda === "none" ? null : formData.idKelompokRonda,
    }

    console.log("🔄 Submitting petugas form:", payload)

    onSubmit(payload)
    onClose()
  }

  const selectedWarga = wargaList.find((w) => w.id === formData.idWarga)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Petugas Baru" : "Edit Data Petugas"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Pilih warga untuk dijadikan petugas dan lengkapi informasi berikut"
              : "Ubah informasi petugas"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Warga - hanya untuk create */}
          {mode === "create" && (
          <div className="space-y-2">
            <Label htmlFor="warga">Nama Warga *</Label>
            <Select
              value={String(formData.idWarga || "")}
              onValueChange={(value) => setFormData({ ...formData, idWarga: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih warga untuk dijadikan petugas" />
              </SelectTrigger>
              <SelectContent>
                {wargaList.map((warga) => (
                  <SelectItem key={warga.id} value={String(warga.id)}>
                    {warga.namaLengkap}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}


          {/* Display nama warga untuk edit */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Nama Warga</Label>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">{initialData?.namaLengkap || "Tidak diketahui"}</p>
                <p className="text-xs text-muted-foreground">Data warga tidak dapat diubah</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="kelompokRonda">Kelompok Ronda</Label>
            <Select
              value={String(formData.idKelompokRonda || "none")}
              onValueChange={(value) => setFormData({ ...formData, idKelompokRonda: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelompok ronda (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada</SelectItem>
                {kelompokRondaList.map((kelompok) => (
                  <SelectItem key={kelompok.id} value={String(kelompok.id)}>
                    {kelompok.namaKelompok}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username * (Contoh: admin123)</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Masukkan username"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === "create" ? "*" : "(kosongkan jika tidak ingin mengubah)"} (Contoh: pass123)
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={mode === "create" ? "Masukkan password" : "Kosongkan jika tidak ingin mengubah"}
                required={mode === "create"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Jabatan */}
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan * (Contoh: Ketua RT)</Label>
            <Select
              value={formData.jabatan}
              onValueChange={(value) => setFormData({ ...formData, jabatan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ketua RT">Ketua RT</SelectItem>
                <SelectItem value="Sekretaris">Sekretaris</SelectItem>
                <SelectItem value="Bendahara">Bendahara</SelectItem>
                <SelectItem value="Koordinator Ronda">Koordinator Ronda</SelectItem>
                <SelectItem value="Anggota Ronda">Anggota Ronda</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "petugas" | "admin" | "super_admin") => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petugas">Petugas</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
                value={formData.status}
                onValueChange={(value: "aktif" | "nonaktif") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* Info tambahan jika mode create */}
          {mode === "create" && selectedWarga && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium">Warga yang dipilih:</p>
              <p className="text-sm text-blue-700">
                <strong>{selectedWarga.namaLengkap}</strong>
              </p>
              <p className="text-xs text-blue-600">
                NIK: {selectedWarga.nik} | {selectedWarga.jenisKelamin}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{mode === "create" ? "Tambah Petugas" : "Simpan Perubahan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

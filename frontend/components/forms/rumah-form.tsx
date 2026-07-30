"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Rumah, Warga } from "@/types/database"
import { getAllWarga, getRumahById } from "@/lib/database"

interface RumahFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<Rumah, "id" | "createdAt" | "updatedAt">) => void
  initialData?: Rumah | null
  mode: "create" | "edit"
}

export function RumahForm({ isOpen, onClose, onSubmit, initialData, mode }: RumahFormProps) {
  const [wargaList, setWargaList] = useState<Warga[]>([])
  const [formData, setFormData] = useState({
    alamat: "",
    rt: "",
    rw: "",
    kodeBarcode: "",
    statusKepemilikan: "milik_sendiri" as "milik_sendiri" | "sewa" | "kontrak",
    idKepalaKeluarga: "",
  })

  useEffect(() => {
    const fetchWarga = async () => {
      try {
        if (mode === "edit" && initialData?.id) {
          const rumahDetail = await getRumahById(initialData.id)
          const penghuni = Array.isArray(rumahDetail.penghuni)
            ? rumahDetail.penghuni.map((p: any) => ({
              id: p.id ?? p.idWarga ?? "",
              namaLengkap: p.namaLengkap ?? "",
              nik: p.nik ?? "",
              jenisKelamin: p.jenisKelamin ?? "",
              statusAktif: p.statusAktif ?? "Aktif",
              nomorHp: p.nomorHp ?? "",
              idRumah: initialData.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
            : []
          setWargaList(penghuni)
        } else {
          const data = await getAllWarga()
          const aktif = Array.isArray(data)
            ? data.filter((w) => w.statusAktif === "Aktif" && !w.idRumah)
            : []
          setWargaList(aktif)
        }
      } catch (err) {
        console.error("Gagal memuat data warga:", err)
      }
    }

    if (isOpen) fetchWarga()
  }, [isOpen, mode, initialData])

  useEffect(() => {
    if (initialData && mode === "edit") {
      // Mapping dari DB ke state frontend
      let statusMapping: "milik_sendiri" | "sewa" | "kontrak" = "milik_sendiri"
      const dbStatus = initialData.statusKepemilikan?.toLowerCase()
      if (dbStatus === "sewa") statusMapping = "sewa"
      else if (dbStatus === "kontrak") statusMapping = "kontrak"

      setFormData({
        alamat: initialData.alamat,
        rt: initialData.rt,
        rw: initialData.rw,
        kodeBarcode: initialData.kodeBarcode,
        statusKepemilikan: statusMapping,
        idKepalaKeluarga: (initialData as any).idKepalaKeluarga?.toString() || "",
      })
    } else {
      const generateBarcode = () => {
        const timestamp = Date.now().toString().slice(-6)
        return `RMH${timestamp}`
      }

      setFormData({
        alamat: "",
        rt: "",
        rw: "",
        kodeBarcode: generateBarcode(),
        statusKepemilikan: "milik_sendiri",
        idKepalaKeluarga: "",
      })
    }
  }, [initialData, mode, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.alamat.trim()) {
      alert("Alamat tidak boleh kosong.")
      return
    }
    if (!formData.rt || !formData.rw) {
      alert("RT dan RW tidak boleh kosong.")
      return
    }

    // Mapping dari state frontend → format MySQL
    let statusKepemilikanBackend = "Milik Sendiri"
    if (formData.statusKepemilikan === "sewa") statusKepemilikanBackend = "Sewa"
    else if (formData.statusKepemilikan === "kontrak") statusKepemilikanBackend = "Kontrak"

    const payload = {
      alamat: formData.alamat,
      rt: formData.rt,
      rw: formData.rw,
      kodeBarcode: formData.kodeBarcode,
      statusKepemilikan: statusKepemilikanBackend,
      idKepalaKeluarga:
        formData.idKepalaKeluarga && formData.idKepalaKeluarga !== "none" && formData.idKepalaKeluarga !== "no-data"
          ? Number(formData.idKepalaKeluarga)
          : null,
    }

    onSubmit(payload as any)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Tambah Rumah Baru" : "Edit Data Rumah"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alamat */}
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Input
              id="alamat"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Masukkan alamat lengkap"
              required
            />
          </div>

          {/* RT/RW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rt">RT</Label>
              <Input
                id="rt"
                value={formData.rt}
                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                placeholder="01"
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rw">RW</Label>
              <Input
                id="rw"
                value={formData.rw}
                onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                placeholder="01"
                maxLength={3}
                required
              />
            </div>
          </div>

          {/* Kepala Keluarga */}
            <div className="space-y-2">
              <Label htmlFor="idKepalaKeluarga">
                Kepala Keluarga
                {mode === "edit" && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (hanya dari anggota rumah ini)
                  </span>
                )}
              </Label>
              <Select
                value={formData.idKepalaKeluarga}
                onValueChange={(value) =>
                  setFormData({ ...formData, idKepalaKeluarga: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder="Pilih kepala keluarga"
                  />
                </SelectTrigger>
                <SelectContent>
                  {mode === "edit" && (
                    <SelectItem value="none">Tidak ada kepala keluarga</SelectItem>
                  )}
                  {wargaList.length > 0 ? (
                    wargaList.map((warga) => (
                      <SelectItem key={warga.id} value={String(warga.id)}>
                        {warga.namaLengkap}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      Tidak ada data warga
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Tampilkan nama yang dipilih */}
              {formData.idKepalaKeluarga && formData.idKepalaKeluarga !== "none" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Dipilih:{" "}
                  <span className="font-medium text-foreground">
                    {wargaList.find((w) => String(w.id) === formData.idKepalaKeluarga)
                      ?.namaLengkap || "Tidak ditemukan"}
                  </span>
                </p>
              )}
            </div>


          {/* Status Kepemilikan */}
          <div className="space-y-2">
            <Label htmlFor="statusKepemilikan">Status Kepemilikan</Label>
            <Select
              value={formData.statusKepemilikan}
              onValueChange={(value: any) => setFormData({ ...formData, statusKepemilikan: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status kepemilikan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milik_sendiri">Milik Sendiri</SelectItem>
                <SelectItem value="sewa">Sewa</SelectItem>
                <SelectItem value="kontrak">Kontrak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Barcode */}
          <div className="space-y-2">
            <Label htmlFor="kodeBarcode">Kode Barcode</Label>
            <Input
              id="kodeBarcode"
              value={formData.kodeBarcode}
              onChange={(e) => setFormData({ ...formData, kodeBarcode: e.target.value })}
              placeholder="Kode barcode otomatis"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{mode === "create" ? "Tambah" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Download, FileText, Users, Clock, FileSpreadsheet, File } from "lucide-react"
import { getAllTransaksi, getAllWarga, getAllKelompokRonda } from "@/lib/database"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function LaporanPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("bulanan")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedKelompok, setSelectedKelompok] = useState("semua")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // ✅ FIX: buat state penampung data async
  const [transaksi, setTransaksi] = useState<any[]>([])
  const [warga, setWarga] = useState<any[]>([])
  const [kelompokRonda, setKelompokRonda] = useState<any[]>([])

  // ✅ FIX: ambil data dengan useEffect agar hasilnya array, bukan Promise
  useEffect(() => {
    async function fetchData() {
      try {
        const [t, w, k] = await Promise.all([getAllTransaksi(), getAllWarga(), getAllKelompokRonda()])

        setTransaksi(Array.isArray(t) ? t : [])
        setWarga(Array.isArray(w) ? w : [])
        setKelompokRonda(Array.isArray(k) ? k : [])
      } catch (err) {
        console.error("Gagal mengambil data laporan:", err)
      }
    }
    fetchData()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Filter data berdasarkan periode yang dipilih
  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (selectedPeriod) {
      case "harian":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "mingguan":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "bulanan":
        startDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth), 1)
        endDate = new Date(Number.parseInt(selectedYear), Number.parseInt(selectedMonth) + 1, 0)
        break
      default:
        startDate = new Date(now.getFullYear(), 0, 1)
    }

    // ✅ Pastikan transaksi adalah array sebelum filter
    return (Array.isArray(transaksi) ? transaksi : []).filter((t) => {
      // Pastikan tanggal_setor ada
      if (!t.tanggal_setor) return false
      
      const transaksiDate = new Date(t.tanggal_setor)
      
      // Validasi tanggal valid
      if (isNaN(transaksiDate.getTime())) return false
      
      return transaksiDate >= startDate && transaksiDate <= endDate
    })
  }

  const filteredTransaksi = getFilteredData()
  
  // ✅ Hitung total dengan validasi yang lebih ketat
  const totalJimpitan = filteredTransaksi.reduce((sum, t) => {
    const nominal = Number(t.nominal)
    return sum + (isNaN(nominal) ? 0 : nominal)
  }, 0)
  
  const totalTransaksi = filteredTransaksi.length
  const wargaBayar = new Set(filteredTransaksi.map((t) => t.id_warga)).size
  const wargaBelumBayar = warga.length - wargaBayar

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  // Data rekap per rumah
  type RekapRumah = {
    rumahId: string
    kepalaNama: string
    alamat: string
    rt: string
    rw: string
    totalBayar: number
    jumlahTransaksi: number
    sudahBayar: boolean
  }

  const getRekapPerRumah = (): RekapRumah[] => {
    const wargaById = new Map(warga.map((w) => [w.id, w]))
    const rekapMap = new Map<string, RekapRumah>()

    warga.forEach((w) => {
      const rumahId = w.idRumah
      const alamat = w.alamatRumah || "Alamat tidak tersedia"
      const rt = w.rt || "-"
      const rw = w.rw || "-"

      if (!rekapMap.has(rumahId)) {
        rekapMap.set(rumahId, {
          rumahId,
          kepalaNama: w.isKepalaKeluarga ? w.namaLengkap : w.namaLengkap,
          alamat,
          rt,
          rw,
          totalBayar: 0,
          jumlahTransaksi: 0,
          sudahBayar: false,
        })
      }

      const current = rekapMap.get(rumahId)!
      if (w.isKepalaKeluarga) current.kepalaNama = w.namaLengkap
    })

    rekapMap.forEach((val, key) => {
      if (!val.kepalaNama) {
        const first = warga.find((w) => w.idRumah === key)
        if (first) val.kepalaNama = first.namaLengkap
      }
    })

    filteredTransaksi.forEach((t) => {
      const w = wargaById.get(t.id_warga)
      if (!w) return
      const rumahId = w.idRumah
      const entry = rekapMap.get(rumahId)
      if (!entry) return
      
      // Validasi nominal sebelum ditambahkan
      const nominal = Number(t.nominal)
      if (!isNaN(nominal)) {
        entry.totalBayar += nominal
      }
      
      entry.jumlahTransaksi += 1
      entry.sudahBayar = true
    })

    return Array.from(rekapMap.values())
  }

  const rekapPerRumah = getRekapPerRumah()

  const handleExportReport = (format: "pdf" | "excel") => {
    try {
      if (format === "excel") {
        exportToExcel()
      } else if (format === "pdf") {
        exportToPDF()
      }
      setIsExportDialogOpen(false)
    } catch (error) {
      console.error("Error exporting report:", error)
      alert("Gagal mengexport laporan. Silakan coba lagi.")
    }
  }

  const exportToExcel = () => {
    // Helper function untuk format rupiah di Excel
    const formatRupiahForExcel = (amount: number) => {
      const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
      return `Rp ${formatted}`
    }

    // Create HTML table
    let tableHTML = `
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr style="background-color: #4CAF50; color: white; font-weight: bold;">
            <th>No</th>
            <th>Nama Kepala Keluarga</th>
            <th>Alamat</th>
            <th>RT</th>
            <th>RW</th>
            <th>Total Bayar</th>
            <th>Jumlah Transaksi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `

    rekapPerRumah.forEach((rumah, index) => {
      const statusColor = rumah.sudahBayar ? "#4CAF50" : "#f44336"
      tableHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${rumah.kepalaNama}</td>
          <td>${rumah.alamat}</td>
          <td>${rumah.rt}</td>
          <td>${rumah.rw}</td>
          <td style="text-align: right;">${formatRupiahForExcel(rumah.totalBayar)}</td>
          <td style="text-align: center;">${rumah.jumlahTransaksi}</td>
          <td style="color: ${statusColor}; font-weight: bold; text-align: center;">${rumah.sudahBayar ? "Sudah Bayar" : "Kosong"}</td>
        </tr>
      `
    })

    tableHTML += `
        </tbody>
        <tfoot>
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td colspan="5" style="text-align: right;">TOTAL</td>
            <td style="text-align: right;">${formatRupiahForExcel(totalJimpitan)}</td>
            <td style="text-align: center;">${totalTransaksi}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `

    // Create blob with Excel XML format
    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" })
    
    // Download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    try {
      // Inisialisasi jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Header - Judul
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("LAPORAN & REKAPAN JIMPITAN", pageWidth / 2, 15, { align: "center" })
      
      // Sub header - Periode
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(`Periode: ${getPeriodDescription()}`, pageWidth / 2, 22, { align: "center" })
      
      // Garis pemisah header
      doc.setLineWidth(0.5)
      doc.setDrawColor(76, 175, 80)
      doc.line(15, 25, pageWidth - 15, 25)
      
      // Summary boxes - layout lebih rapi
      const startY = 32
      const boxWidth = 65
      const boxHeight = 18
      const spacing = 5
      const totalBoxesWidth = (boxWidth * 4) + (spacing * 3)
      const startX = (pageWidth - totalBoxesWidth) / 2
      
      // Helper function untuk membuat box
      const drawSummaryBox = (x: number, y: number, title: string, value: string, color: number[]) => {
        // Border dengan warna, background putih
        doc.setDrawColor(color[0], color[1], color[2])
        doc.setFillColor(255, 255, 255) // Background putih
        doc.setLineWidth(2)
        doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "FD")
        
        // Title dengan warna abu-abu
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(120, 120, 120)
        doc.text(title, x + boxWidth / 2, y + 6, { align: "center" })
        
        // Value dengan warna sesuai kategori
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(color[0], color[1], color[2])
        doc.text(value, x + boxWidth / 2, y + 14, { align: "center" })
      }
      
      // Box 1: Total Jimpitan
      drawSummaryBox(startX, startY, "Total Jimpitan", formatCurrency(totalJimpitan), [76, 175, 80])
      
      // Box 2: Total Transaksi
      drawSummaryBox(startX + boxWidth + spacing, startY, "Total Transaksi", totalTransaksi.toString(), [33, 150, 243])
      
      // Box 3: Sudah Bayar
      drawSummaryBox(startX + (boxWidth + spacing) * 2, startY, "Warga Sudah Bayar", wargaBayar.toString(), [76, 175, 80])
      
      // Box 4: Belum Bayar
      drawSummaryBox(startX + (boxWidth + spacing) * 3, startY, "Warga Belum Bayar", wargaBelumBayar.toString(), [244, 67, 54])
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      // Tabel data
      const tableData = rekapPerRumah.map((rumah, index) => [
        (index + 1).toString(),
        rumah.kepalaNama,
        rumah.alamat,
        rumah.rt,
        rumah.rw,
        formatCurrency(rumah.totalBayar),
        rumah.jumlahTransaksi.toString(),
        rumah.sudahBayar ? "Sudah Bayar" : "Kosong"
      ])
      
      autoTable(doc, {
        startY: startY + boxHeight + 8,
        head: [["No", "Nama Kepala Keluarga", "Alamat", "RT", "RW", "Total Bayar", "Transaksi", "Status"]],
        body: tableData,
        foot: [["", "", "", "", "TOTAL", formatCurrency(totalJimpitan), totalTransaksi.toString(), ""]],
        theme: "striped",
        headStyles: {
          fillColor: [76, 175, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 9,
          cellPadding: 4
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: 4,
          minCellHeight: 10
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { halign: "left", cellWidth: 55 },
          2: { halign: "left", cellWidth: 75 },
          3: { halign: "center", cellWidth: 12 },
          4: { halign: "center", cellWidth: 12 },
          5: { halign: "right", cellWidth: 38 },
          6: { halign: "center", cellWidth: 20 },
          7: { halign: "center", cellWidth: 28 }
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          valign: "middle"
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        didParseCell: function(data) {
          // Warna status
          if (data.column.index === 7 && data.section === 'body') {
            const status = data.cell.text[0]
            if (status === "Sudah Bayar") {
              data.cell.styles.textColor = [76, 175, 80]
              data.cell.styles.fontStyle = "bold"
            } else if (status === "Kosong") {
              data.cell.styles.textColor = [244, 67, 54]
              data.cell.styles.fontStyle = "bold"
            }
          }
          
          // Footer alignment dan styling - TOTAL horizontal
          if (data.section === 'foot') {
            data.cell.styles.valign = "middle"
            data.cell.styles.overflow = "linebreak"
            data.cell.styles.cellWidth = "wrap"
            
            if (data.column.index === 4) {
              data.cell.styles.halign = "right"
              data.cell.styles.fontStyle = "bold"
            } else if (data.column.index === 5) {
              data.cell.styles.halign = "right"
              data.cell.styles.fontStyle = "bold"
            } else if (data.column.index === 6) {
              data.cell.styles.halign = "center"
              data.cell.styles.fontStyle = "bold"
            }
          }
        }
      })
      
      // Footer
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // Garis pemisah footer
        doc.setLineWidth(0.3)
        doc.setDrawColor(200, 200, 200)
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15)
        
        // Info cetak
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(120, 120, 120)
        doc.text(
          `Dicetak pada: ${new Date().toLocaleString("id-ID", { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}`,
          pageWidth - 15,
          pageHeight - 10,
          { align: "right" }
        )
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          15,
          pageHeight - 10
        )
      }
      
      // Download PDF
      const fileName = `Laporan_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Gagal membuat PDF. Silakan coba lagi.")
    }
  }

  const getPeriodDescription = () => {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]
    
    switch (selectedPeriod) {
      case "harian":
        return new Date().toLocaleDateString("id-ID")
      case "mingguan":
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return `${weekAgo.toLocaleDateString("id-ID")} - ${new Date().toLocaleDateString("id-ID")}`
      case "bulanan":
        return `${months[Number.parseInt(selectedMonth)]} ${selectedYear}`
      case "tahunan":
        return selectedYear
      default:
        return ""
    }
  }

  return (
    <DashboardLayout title="Laporan & Rekapan">
      {/* Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Periode</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === "bulanan" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bulan</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tahun</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Kelompok</label>
              <Select value={selectedKelompok} onValueChange={setSelectedKelompok}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kelompok</SelectItem>
                  {kelompokRonda.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.namaKelompok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4 mr-2" />
                  Export Laporan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Pilih Format Export</DialogTitle>
                  <DialogDescription>Pilih jenis file untuk mengexport laporan rekapan</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 bg-transparent"
                    onClick={() => handleExportReport("pdf")}
                  >
                    <File className="h-5 w-5 mr-3 text-red-600" />
                    <div className="text-left">
                      <div className="font-semibold">PDF Document</div>
                      <div className="text-sm text-muted-foreground">Format dokumen untuk cetak dan arsip</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-4 bg-transparent"
                    onClick={() => handleExportReport("excel")}
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">Excel Spreadsheet</div>
                      <div className="text-sm text-muted-foreground">Format untuk analisis dan perhitungan</div>
                    </div>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">Rp</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Jimpitan</p>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalJimpitan)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold text-card-foreground">{totalTransaksi}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Warga Sudah Bayar</p>
                <p className="text-2xl font-bold text-card-foreground">{wargaBayar}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Warga Belum Bayar</p>
                <p className="text-2xl font-bold text-card-foreground">{wargaBelumBayar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rekap Per Rumah */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap Per Rumah</CardTitle>
          <CardDescription>Daftar semua rumah dengan status pembayaran periode {selectedPeriod}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rekapPerRumah.map((rumah, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-gray-50"
              >
                {/* left: identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-card-foreground">{rumah.kepalaNama}</h4>
                      <p className="text-sm text-muted-foreground">{rumah.alamat}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">RT {rumah.rt}</Badge>
                      <Badge variant="outline">RW {rumah.rw}</Badge>
                    </div>
                  </div>
                </div>

                {/* right: totals + status */}
                <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-auto">
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">{formatCurrency(rumah.totalBayar)}</p>
                    <p className="text-sm text-muted-foreground">{rumah.jumlahTransaksi} transaksi</p>
                  </div>
                  <Badge
                    variant={rumah.sudahBayar ? "default" : "destructive"}
                    className={rumah.sudahBayar ? "bg-primary/10 text-primary" : ""}
                  >
                    {rumah.sudahBayar ? "Sudah Bayar" : "Kosong"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

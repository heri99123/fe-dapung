"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateBarcodeData, generateBarcodeUrl } from "@/lib/barcode"
import { Download, Printer, QrCode } from "lucide-react"
import { updateRumah } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import type { Rumah } from "@/types/database"

interface BarcodeGeneratorProps {
  rumah: Rumah[]
}

export function BarcodeGenerator({ rumah }: BarcodeGeneratorProps) {
  const [selectedRumah, setSelectedRumah] = useState<Rumah | null>(null)
  const [generatedBarcode, setGeneratedBarcode] = useState<string>("")
  const [barcodeUrl, setBarcodeUrl] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerateBarcode = async (rumahData: Rumah) => {
    setIsSaving(true)
    try {
      // Jika sudah ada barcode, gunakan yang sudah ada
      let barcodeData = rumahData.kodeBarcode
      
      // Hanya generate barcode baru jika belum ada
      if (!barcodeData) {
        barcodeData = generateBarcodeData(rumahData.id, rumahData.alamat)
        
        // Simpan barcode baru ke database
        await updateRumah(rumahData.id, {
          alamat: rumahData.alamat,
          rt: rumahData.rt,
          rw: rumahData.rw,
          kodeBarcode: barcodeData,
        })
        
        toast({
          title: "Berhasil",
          description: "Barcode berhasil di-generate dan disimpan",
        })
      } else {
        toast({
          title: "Informasi",
          description: "Menampilkan barcode yang sudah ada",
        })
      }
      
      const url = generateBarcodeUrl(barcodeData)

      setSelectedRumah(rumahData)
      setGeneratedBarcode(barcodeData)
      setBarcodeUrl(url)
    } catch (error) {
      console.error("Error generating barcode:", error)
      toast({
        title: "Error",
        description: "Gagal membuat barcode",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrintBarcode = () => {
    if (!selectedRumah || !barcodeUrl) return

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Barcode - ${selectedRumah.alamat}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .barcode-container {
                border: 2px solid #000;
                padding: 20px;
                margin: 20px auto;
                width: 300px;
              }
              .barcode-info {
                margin-top: 10px;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <h2>Dana Warga</h2>
              <img src="${barcodeUrl}" alt="Barcode" />
              <div class="barcode-info">
                <p><strong>Alamat:</strong> ${selectedRumah.alamat}</p>
                <p><strong>RT/RW:</strong> ${selectedRumah.rt}/${selectedRumah.rw}</p>
                <p><strong>Kode:</strong> ${generatedBarcode}</p>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadBarcode = () => {
    if (!barcodeUrl) return

    const link = document.createElement("a")
    link.href = barcodeUrl
    link.download = `barcode-${generatedBarcode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Barcode Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generator Barcode Rumah
          </CardTitle>
          <CardDescription>Pilih rumah untuk generate barcode yang akan ditempel di setiap rumah</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rumah.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{r.alamat}</h4>
                      <Badge variant="outline">
                        RT {r.rt}/RW {r.rw}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Kode: {r.kodeBarcode || "Belum di-generate"}</p>
                    <Button 
                      onClick={() => handleGenerateBarcode(r)} 
                      className="w-full" 
                      size="sm" 
                      disabled={isSaving}
                      variant={r.kodeBarcode ? "outline" : "default"}
                    >
                      {isSaving ? "Loading..." : r.kodeBarcode ? "Lihat Barcode" : "Generate Barcode"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Barcode Display */}
      {selectedRumah && generatedBarcode && (
        <Card>
          <CardHeader>
            <CardTitle>Barcode Generated</CardTitle>
            <CardDescription>Barcode untuk {selectedRumah.alamat}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="text-center space-y-4">
                  <div className="border-2 border-dashed border-border p-6 rounded-lg">
                    <img src={barcodeUrl || "/placeholder.svg"} alt="Generated Barcode" className="mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kode Barcode</Label>
                    <Input value={generatedBarcode} readOnly className="text-center font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informasi Rumah</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alamat:</span>
                      <span>{selectedRumah.alamat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RT/RW:</span>
                      <span>
                        {selectedRumah.rt}/{selectedRumah.rw}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kode Barcode:</span>
                      <span className="font-mono">{generatedBarcode}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={handlePrintBarcode} className="w-full bg-transparent" variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Cetak Barcode
                  </Button>
                  <Button onClick={handleDownloadBarcode} className="w-full bg-transparent" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    <strong>Petunjuk:</strong> Cetak barcode dan tempel di depan rumah untuk memudahkan petugas dalam
                    proses pengumpulan dana.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

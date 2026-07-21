"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BarcodeScanner } from "@/components/barcode/barcode-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Wallet, CheckCircle, Home, User } from "lucide-react"
import type { Warga, JenisDana } from "@/types/database"
import { useRouter } from "next/navigation"
import type { User as AuthUser } from "@/types/auth"
import { getAllJenisDana, createTransaksi } from "@/lib/database"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

export default function ScanBarcodePage() {
  const [step, setStep] = useState<"select-jenis" | "scan-barcode" | "input-nominal">("select-jenis")
  const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null)
  const [selectedJenisDana, setSelectedJenisDana] = useState<JenisDana | null>(null)
  const [selectedNominal, setSelectedNominal] = useState<number>(0)
  const [customNominal, setCustomNominal] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState("")
  const [isAllowed, setIsAllowed] = useState(false)
  const [jenisDanaList, setJenisDanaList] = useState<JenisDana[]>([])
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("currentUser")
      if (!savedUser) return
      const user = JSON.parse(savedUser) as AuthUser
      if (user.role !== "petugas") {
        router.replace("/dashboard")
      } else {
        setCurrentUser(user)
        setIsAllowed(true)
      }
    } catch {
      router.replace("/dashboard")
    }
  }, [router])

  useEffect(() => {
    const fetchJenisDana = async () => {
      try {
        const data = await getAllJenisDana()
        setJenisDanaList(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching jenis dana:", error)
        toast({
          title: "Error",
          description: "Gagal memuat jenis dana",
          variant: "destructive",
        })
      }
    }

    fetchJenisDana()
  }, [])

  const handleSelectJenisDana = (jenis: JenisDana) => {
    setSelectedJenisDana(jenis)
    setStep("scan-barcode")
    setSelectedWarga(null)
    setSelectedNominal(0)
    setCustomNominal("")
  }

  const handleWargaFound = (warga: Warga) => {
    setSelectedWarga(warga)
    setStep("input-nominal")
    setSelectedNominal(0)
  }

  const handleCustomNominalChange = (value: string) => {
    setCustomNominal(value)
    const numValue = Number.parseInt(value.replace(/\D/g, ""))
    if (!isNaN(numValue)) {
      setSelectedNominal(numValue)
    }
  }

  const handleSubmitTransaction = async () => {
    if (!selectedWarga || selectedNominal <= 0 || !selectedJenisDana || !currentUser) return

    setIsProcessing(true)
    try {
      const transactionData = {
        id_warga: selectedWarga.id,
        id_jenis_dana: selectedJenisDana.id,
        id_user: currentUser.id,
        tanggal_setor: new Date().toISOString().split('T')[0],
        nominal: selectedNominal,
        status_jimpitan: "lunas" as const,
      }

      await apiClient.post(`/transaksi`, transactionData)

      setSuccess(
        `Transaksi ${selectedJenisDana.namaDana} berhasil disimpan! Dana Rp ${selectedNominal.toLocaleString("id-ID")} dari ${selectedWarga.namaLengkap}`,
      )

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil disimpan",
      })

      // Reset form after success
      setTimeout(() => {
        setSelectedWarga(null)
        setSelectedNominal(0)
        setCustomNominal("")
        setSuccess("")
        setSelectedJenisDana(null)
        setStep("select-jenis")
      }, 3000)
    } catch (error: any) {
      const {message} = error

      toast({
        title: "Peringatan!",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBackToJenisDana = () => {
    setSelectedWarga(null)
    setSelectedNominal(0)
    setCustomNominal("")
    setSuccess("")
    setSelectedJenisDana(null)
    setStep("select-jenis")
  }

  const handleBackToScanner = () => {
    setSelectedWarga(null)
    setSelectedNominal(selectedJenisDana?.nominalDefault || 0)
    setCustomNominal("")
    setSuccess("")
    setStep("scan-barcode")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout title="Scan Barcode">
      {!isAllowed ? null : (
        <div className="space-y-6">
          {/* Step 1: Pilih Jenis Dana */}
          {step === "select-jenis" && (
            <Card>
              <CardHeader>
                <CardTitle>Pilih Jenis Dana</CardTitle>
                <CardDescription>Pilih jenis dana yang akan diinput terlebih dahulu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {jenisDanaList.map((jenis) => (
                    <div
                      key={jenis.id}
                      onClick={() => handleSelectJenisDana(jenis)}
                      className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-5 hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <h3 className="font-semibold text-card-foreground text-lg mb-1">{jenis.namaDana}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{jenis.deskripsi}</p>
                      <Badge className="bg-primary/15 text-primary font-semibold">
                        {formatCurrency(jenis.nominalDefault || 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Scan Barcode */}
          {step === "scan-barcode" && (
            <>
              <Button variant="outline" onClick={handleBackToJenisDana} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Pilihan Jenis Dana
              </Button>

              {selectedJenisDana && (
                <Alert className="border-primary/30 bg-primary/10 mb-4">
                  <Wallet className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-foreground">
                    <strong>Jenis Dana Dipilih:</strong> {selectedJenisDana.namaDana}
                  </AlertDescription>
                </Alert>
              )}

              <BarcodeScanner onWargaFound={handleWargaFound} />
            </>
          )}

          {/* Step 3: Input Nominal */}
          {step === "input-nominal" && selectedWarga && (
            <>
              <Button variant="outline" onClick={handleBackToScanner} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Scan Barcode Lain
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Input Nominal Dana - {selectedJenisDana?.namaDana}
                  </CardTitle>
                  <CardDescription>
                    Masukkan nominal dana yang disetor
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info Rumah dan Warga */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                        <Home className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Rumah: {selectedWarga.alamatRumah}</h3>
                        <p className="text-sm text-muted-foreground">RT {selectedWarga.rt} / RW {selectedWarga.rw}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Kepala Keluarga: {selectedWarga.namaLengkap}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedWarga.nomorHp && `HP: ${selectedWarga.nomorHp}`}
                        </p>
                      </div>
                      <Badge variant="default" className="ml-auto">
                        Aktif
                      </Badge>
                    </div>
                  </div>

                  {/* Input Nominal */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-nominal">Masukkan Nominal</Label>
                    <Input
                      id="custom-nominal"
                      type="text"
                      placeholder="Masukkan nominal..."
                      value={customNominal}
                      onChange={(e) => handleCustomNominalChange(e.target.value)}
                      className="text-lg h-12"
                      autoFocus
                    />
                    <p className="text-sm text-muted-foreground">
                      Contoh: 500, 1000, 2000, 5000, dst.
                    </p>
                  </div>

                  {/* Preview Nominal */}
                  {selectedNominal > 0 && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Nominal yang akan diinput:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(selectedNominal)}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitTransaction}
                    disabled={selectedNominal <= 0 || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                        Menyimpan Transaksi...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Simpan Transaksi
                      </>
                    )}
                  </Button>

                  {/* Success Message */}
                  {success && (
                    <Alert className="border-primary/30 bg-primary/10">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-foreground">{success}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

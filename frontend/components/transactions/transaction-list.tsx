"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Filter, Download, Search, Plus, Trash2, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getTransaksi, getTransactionSummary, createTransaksi, deleteTransaksi } from "@/lib/transactions"
import { getWarga, getJenisDana, checkPetugasScheduleToday } from "@/lib/database"
import { getTodayDayName } from "@/lib/schedule-utils"
import type { Transaksi, Warga, JenisDana } from "@/types/database"
import type { TransactionFilter, TransactionSummary } from "@/lib/transactions"
import { ManualTransactionForm } from "./manual-transaction-form"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

export function TransactionList() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [warga, setWarga] = useState<Warga[]>([])
  const [jenisDana, setJenisDana] = useState<JenisDana[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>({ status_jimpitan: "all" })
  const [searchTerm, setSearchTerm] = useState("")
  const [isManualFormOpen, setIsManualFormOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasScheduleToday, setHasScheduleToday] = useState(false)
  const [scheduleInfo, setScheduleInfo] = useState<{
    todayName: string
    jadwalHari?: string
    namaKelompok?: string
  }>({ todayName: '' })

  // Memoize checkSchedule
  const checkSchedule = useCallback(async (user: any) => {
    try {
      if (user.role === 'admin' || user.role === 'super_admin') {
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
        return
      }
      
      if (user.role === 'petugas' && user.id) {
        const scheduleCheck = await apiClient.get(`/petugas/${user.id}/check-schedule`).then((response) => response.data) as any
        setHasScheduleToday(scheduleCheck.hasScheduleToday)

        setScheduleInfo({
          todayName: scheduleCheck.todayName,
          jadwalHari: scheduleCheck.jadwalHari || '',
          namaKelompok: scheduleCheck.namaKelompok || ''
        })
      } else {
        setHasScheduleToday(true)
        setScheduleInfo({ todayName: getTodayDayName() })
      }
    } catch (error) {
      console.error('Error checking schedule:', error)
      setHasScheduleToday(true)
      setScheduleInfo({ todayName: getTodayDayName() })
    }
  }, [])

  useEffect(() => {
    // Get current user dari localStorage
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setCurrentUser(user)
      checkSchedule(user)
    } else {
      setHasScheduleToday(true)
      setScheduleInfo({ todayName: getTodayDayName() })
    }
  }, [checkSchedule])
  
  useEffect(() => {
    let isMounted = true
    let isFetching = false
    
    const fetchData = async () => {
      // Prevent multiple simultaneous fetches
      if (isFetching || !isMounted) return
      
      isFetching = true
      setLoading(true)
      
      try {
        // Fetch warga dan jenisDana hanya sekali di awal
        const promises: Promise<any>[] = [
          getTransaksi(filter),
          getTransactionSummary(filter),
        ]
        
        if (warga.length === 0) {
          promises.push(getWarga())
        }
        if (jenisDana.length === 0) {
          promises.push(getJenisDana())
        }

        const results = await Promise.all(promises)
        
        if (!isMounted) return
        
        // Update state
        setTransaksi(results[0])
        setSummary(results[1])
        
        // Update warga dan jenisDana jika baru di-fetch
        let index = 2
        if (warga.length === 0 && results[index]) {
          setWarga(results[index])
          index++
        }
        if (jenisDana.length === 0 && results[index]) {
          setJenisDana(results[index])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
        isFetching = false
      }
    }

    // Initial fetch
    fetchData()
    
    // Auto-refresh setiap 30 detik (lebih efisien)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetching) {
        fetchData()
      }
    }, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [filter]) // Hapus warga dan jenisDana dari dependency

  const handleFilterChange = (newFilter: Partial<TransactionFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }))
  }

  const clearFilters = () => {
    setFilter({ status_jimpitan: "all" })
    setSearchTerm("")
  }

  const handleDeleteTransaction = useCallback(async (transaksiId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.")) {
      return
    }

    try {
      const success = await deleteTransaksi(transaksiId.toString())
      if (success) {
        toast({
          title: "Berhasil",
          description: "Transaksi berhasil dihapus",
        })
        // Refresh data
        const [transaksiData, summaryData] = await Promise.all([getTransaksi(filter), getTransactionSummary(filter)])
        setTransaksi(transaksiData)
        setSummary(summaryData)
      } else {
        throw new Error("Gagal menghapus transaksi")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus transaksi",
        variant: "destructive",
      })
    }
  }, [filter])

  const handleManualTransactionSubmit = useCallback(async (data: any) => {
    try {
      await createTransaksi(data)
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan",
      })
      // Refresh data
      const [transaksiData, summaryData] = await Promise.all([getTransaksi(filter), getTransactionSummary(filter)])
      setTransaksi(transaksiData)
      setSummary(summaryData)
      setIsManualFormOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      })
    }
  }, [filter])

  const getWargaName = useCallback((transaksi: any) => {
    // Prioritas: gunakan nama dari backend JOIN, fallback ke mapping manual
    if (transaksi.namaWarga) {
      return transaksi.namaWarga
    }
    const w = warga.find((w) => w.id == transaksi.id_warga)
    return w ? w.namaLengkap : "Unknown"
  }, [warga])

  const getJenisDanaName = useCallback((transaksi: any) => {
    // Prioritas: gunakan nama dari backend JOIN, fallback ke mapping manual
    if (transaksi.jenisDana) {
      return transaksi.jenisDana
    }
    const jd = jenisDana.find((jd) => jd.id == transaksi.id_jenis_dana || jd.id == transaksi.id_jenis)
    return jd ? jd.namaDana : "Unknown"
  }, [jenisDana])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }, [])

  // Memoize filtered transaksi untuk performa
  const filteredTransaksi = useMemo(() => {
    return transaksi.filter((t) => {
      const wargaName = getWargaName(t).toLowerCase()
      const jenisDanaName = getJenisDanaName(t).toLowerCase()
      const searchLower = searchTerm.toLowerCase()

      return wargaName.includes(searchLower) || jenisDanaName.includes(searchLower)
    })
  }, [transaksi, searchTerm, getWargaName, getJenisDanaName])

  const handleExportExcel = useCallback(() => {
    try {
      // Prepare data untuk export
      const exportData = filteredTransaksi.map((t, index) => ({
        no: index + 1,
        tanggal: format(new Date(t.tanggal_setor), "dd/MM/yyyy", { locale: id }),
        warga: getWargaName(t),
        nik: warga.find((w) => w.id == t.id_warga)?.nik || "-",
        jenisDana: getJenisDanaName(t),
        nominal: t.nominal,
        status: t.status_jimpitan === "lunas" ? "Lunas" : "Belum Lunas",
        waktuInput: format(new Date(t.waktu_input), "dd/MM/yyyy HH:mm", { locale: id }),
      }))

      // Hitung total dengan validasi
      const totalNominal = exportData.reduce((sum, row) => {
        const nominal = Number(row.nominal)
        return sum + (isNaN(nominal) ? 0 : nominal)
      }, 0)

      // Create HTML table dengan styling
      let tableHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Transaksi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
          <style>
            .nik { mso-number-format:"\\@"; }
          </style>
        </head>
        <body>
          <h2 style="text-align: center;">LAPORAN TRANSAKSI DANA WARGA</h2>
          <p style="text-align: center;">Tanggal Export: ${new Date().toLocaleString("id-ID")}</p>
          
          <table border="0" cellpadding="5" style="margin: 20px 0;">
            <tr>
              <td><b>Total Transaksi:</b></td>
              <td>${filteredTransaksi.length}</td>
              <td><b>Total Dana:</b></td>
              <td>${formatCurrency(summary?.totalNominal || 0)}</td>
            </tr>
            <tr>
              <td><b>Dana Hari Ini:</b></td>
              <td>${formatCurrency(summary?.totalHariIni || 0)}</td>
              <td><b>Dana Bulan Ini:</b></td>
              <td>${formatCurrency(summary?.totalBulanIni || 0)}</td>
            </tr>
          </table>
          
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #4CAF50; color: white; font-weight: bold;">
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Warga</th>
                <th>NIK</th>
                <th>Jenis Dana</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Waktu Input</th>
              </tr>
            </thead>
            <tbody>
      `

      exportData.forEach((row) => {
        const statusColor = row.status === "Lunas" ? "#4CAF50" : "#FFA726"
        // Format NIK sebagai text dengan menambahkan prefix '=' dan petik ganda untuk mencegah scientific notation
        const nikFormatted = row.nik !== "-" ? `="${row.nik}"` : "-"
        
        tableHTML += `
          <tr>
            <td style="text-align: center;">${row.no}</td>
            <td>${row.tanggal}</td>
            <td>${row.warga}</td>
            <td class="nik" style="mso-number-format:'\\@';">${nikFormatted}</td>
            <td>${row.jenisDana}</td>
            <td style="text-align: right;">${formatCurrency(row.nominal)}</td>
            <td style="color: ${statusColor}; font-weight: bold; text-align: center;">${row.status}</td>
            <td style="text-align: center;">${row.waktuInput}</td>
          </tr>
        `
      })

      tableHTML += `
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="5" style="text-align: right;">TOTAL:</td>
                <td style="text-align: right;">${formatCurrency(totalNominal)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </body>
        </html>
      `

      // Create blob dan download
      const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `Transaksi_Dana_${new Date().toISOString().split("T")[0]}.xls`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Berhasil",
        description: "File Excel berhasil didownload",
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Export Gagal",
        description: "Gagal mengexport data transaksi",
        variant: "destructive",
      })
    }
  }, [filteredTransaksi, getWargaName, getJenisDanaName, formatCurrency, summary, warga])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading transaksi...</p>
        </div>
      </div>
    )
  }
  
  // Jika user adalah petugas dan tidak memiliki jadwal hari ini, tampilkan hanya notifikasi
  if (currentUser && currentUser.role === 'petugas' && !hasScheduleToday) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <CalendarIcon className="h-5 w-5" />
              Tidak Ada Jadwal Ronda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-300 bg-orange-100">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <div className="font-semibold mb-2">Hari ini bukan jadwal ronda Anda. Anda tidak dapat menginputkan transaksi dana.</div>
                <div className="space-y-1 text-sm">
                  <div>• Hari ini: <strong>{scheduleInfo.todayName}</strong></div>
                  {scheduleInfo.namaKelompok && (
                    <div>• Kelompok Anda: <strong>{scheduleInfo.namaKelompok}</strong></div>
                  )}
                  {scheduleInfo.jadwalHari && (
                    <div>• Jadwal ronda Anda: <strong>{scheduleInfo.jadwalHari}</strong></div>
                  )}
                  {!scheduleInfo.jadwalHari && (
                    <div className="text-red-600">• Anda belum terdaftar dalam kelompok ronda manapun</div>
                  )}
                </div>
                <div className="mt-3 text-sm">
                  <p>Untuk melihat data transaksi, silakan hubungi admin. Untuk input transaksi, silakan login pada hari sesuai jadwal ronda Anda.</p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTransaksi}</div>
              <p className="text-xs text-muted-foreground">Semua transaksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Dana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalNominal)}</div>
              <p className="text-xs text-muted-foreground">Semua dana terkumpul</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dana Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalHariIni)}</div>
              <p className="text-xs text-muted-foreground">Transaksi hari ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dana Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalBulanIni)}</div>
              <p className="text-xs text-muted-foreground">Rata-rata: {formatCurrency(summary.rataRataHarian)}/hari</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Transaksi
              </CardTitle>
              <CardDescription>Filter transaksi berdasarkan tanggal, warga, atau jenis dana</CardDescription>
            </div>
            <Button onClick={() => setIsManualFormOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Transaksi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label>Cari Warga/Jenis Dana</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau jenis dana..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.startDate ? format(filter.startDate, "dd MMM yyyy", { locale: id }) : format(new Date(), "dd MMM yyyy", { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.startDate}
                    onSelect={(date) => handleFilterChange({ startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.endDate ? format(filter.endDate, "dd MMM yyyy", { locale: id }) : format(new Date(), "dd MMM yyyy", { locale: id })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.endDate}
                    onSelect={(date) => handleFilterChange({ endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleExportExcel} className="bg-transparent">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Menampilkan {filteredTransaksi.length} dari {transaksi.length} transaksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Warga</TableHead>
                  <TableHead>Jenis Dana</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Input</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransaksi.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{format(new Date(t.tanggal_setor), "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell className="font-medium">{getWargaName(t)}</TableCell>
                    <TableCell>{getJenisDanaName(t)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(t.nominal)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status_jimpitan === "lunas" ? "default" : "secondary"}
                        className={t.status_jimpitan === "lunas" ? "bg-primary" : "bg-yellow-500"}
                      >
                        {t.status_jimpitan === "lunas" ? "Lunas" : "Belum Lunas"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(t.waktu_input), "HH:mm", { locale: id })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTransaksi.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ManualTransactionForm
        isOpen={isManualFormOpen}
        onClose={() => setIsManualFormOpen(false)}
        onSubmit={handleManualTransactionSubmit}
      />
    </div>
  )
}

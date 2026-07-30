"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, Filter, Search } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/types/database"
import { apiClient } from "@/lib/api"

interface AttendanceManagementProps {
  currentUser: User
}

interface PresensiData {
  id: string
  id_warga: string
  namaWarga: string
  namaPetugas?: string
  tanggal: string
  check_in: string | null
  check_out: string | null
  status: string
  keterangan?: string
}

interface SummaryData {
  totalHadir: number
  totalIzin: number
  totalSakit: number
  totalAlpha: number
  persentaseKehadiran: number
}

export function AttendanceManagement({ currentUser }: AttendanceManagementProps) {
  const [presensi, setPresensi] = useState<PresensiData[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
    persentaseKehadiran: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
    
    // Auto-refresh setiap 30 detik
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      
      // Format dates untuk query
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')
      
      console.log('Fetching presensi with dates:', startDateStr, endDateStr)
      
      // Fetch presensi data
      const response = await apiClient.get(
        `/presensi?startDate=${startDateStr}&endDate=${endDateStr}&_t=${Date.now()}`
      )
      const data = await response.data as any
      
      console.log('Presensi data received:', data)
      
      if (response.success && Array.isArray(response.data)) {
        setPresensi(response.data)
        
        // Calculate summary
        const hadir = data.filter((p: PresensiData) => p.status?.toLowerCase() === 'hadir').length
        const izin = data.filter((p: PresensiData) => p.status?.toLowerCase() === 'izin').length
        const sakit = data.filter((p: PresensiData) => p.status?.toLowerCase() === 'sakit').length
        const alpha = data.filter((p: PresensiData) => p.status?.toLowerCase() === 'alpha' || p.status?.toLowerCase() === 'tidak hadir').length
        const total = data.length
        
        setSummary({
          totalHadir: hadir,
          totalIzin: izin,
          totalSakit: sakit,
          totalAlpha: alpha,
          persentaseKehadiran: total > 0 ? (hadir / total) * 100 : 0
        })
      } else {
        setPresensi([])
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err)
      setError("Gagal memuat data absensi")
      setPresensi([])
    } finally {
      setLoading(false)
    }
  }

  const filteredPresensi = presensi.filter((p) => {
    if (!p.namaWarga) return false
    const wargaName = p.namaWarga.toLowerCase()
    return wargaName.includes(searchTerm.toLowerCase())
  })

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'hadir'
    
    const statusConfig = {
      hadir: { variant: "default" as const, className: "bg-primary text-white", label: "Hadir" },
      izin: { variant: "secondary" as const, className: "bg-blue-500 text-white", label: "Izin" },
      sakit: { variant: "secondary" as const, className: "bg-yellow-500 text-white", label: "Sakit" },
      alpha: { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Alpha" },
      "tidak hadir": { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Tidak Hadir" },
    }
    
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.hadir
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatDateTime = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return '-'
    try {
      const date = new Date(dateTimeStr)
      return format(date, 'dd MMM yyyy HH:mm', { locale: id })
    } catch {
      return '-'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading data absensi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Hadir</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHadir}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Izin</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalIzin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sakit</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSakit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alpha</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalAlpha}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Persentase</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.persentaseKehadiran.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Absensi
          </CardTitle>
          <CardDescription>Gunakan filter untuk menampilkan data kehadiran petugas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Cari Petugas</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama petugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
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
                    {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi</CardTitle>
          <CardDescription>
            Menampilkan {filteredPresensi.length} dari {presensi.length} data absensi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {filteredPresensi.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Tidak ada data absensi untuk periode yang dipilih</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama Petugas</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPresensi.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{p.namaWarga || '-'}</TableCell>
                      <TableCell>
                        {p.tanggal ? format(new Date(p.tanggal), 'dd MMM yyyy', { locale: id }) : '-'}
                      </TableCell>
                      <TableCell>{formatDateTime(p.check_in)}</TableCell>
                      <TableCell>{formatDateTime(p.check_out)}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.keterangan || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, Users, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { apiClient } from "@/lib/api"

interface Member {
  namaLengkap: string
  jabatan: string
  status: "Hadir" | "Izin" | "Tidak Hadir" | "Alpha"
  check_in?: string
  check_out?: string
  keterangan?: string
}

interface KelompokRonda {
  id: number
  namaKelompok: string
  jadwalHari?: string
  totalAnggota: number
  hadirCount: number
  izinCount: number
  sakitCount: number
  alphaCount: number
  members?: Member[]
}

interface RondaInfo {
  date: string
  groups: KelompokRonda[]
  members: Array<{
    kelompokId: number
    namaKelompok: string
    namaLengkap: string
    jabatan: string
    status: string
    check_in?: string
    check_out?: string
  }>
}

interface KelompokRondaInfoProps {
  className?: string
  userRole?: "warga" | "petugas" | "admin" | "super_admin"
}

export function KelompokRondaInfo({ className, userRole = "petugas" }: KelompokRondaInfoProps) {
  const [data, setData] = useState<{
    today: RondaInfo
    yesterday: RondaInfo
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRondaInfo()
    
    // Event listener untuk refresh data saat halaman di-focus kembali
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page is visible again, refreshing ronda info...')
        fetchRondaInfo()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchRondaInfo = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/warga-ronda/info")
      const result = await response.data as any

      if (response.success) {
        console.log('=== KELOMPOK RONDA INFO RESPONSE ===')
        console.log('API Response:', result)
        console.log('Today groups:', result.today.groups.length)
        console.log('Today members:', result.today.members.length)
        console.log('Yesterday groups:', result.yesterday.groups.length)
        console.log('Yesterday members:', result.yesterday.members.length)
        
        // Detail status untuk today members
        console.log('Today member statuses:')
        result.today.members.forEach((m: any) => {
          console.log(`  - ${m.namaLengkap}: "${m.status}" (kelompok: ${m.namaKelompok})`)
        })
        
        console.log('\nYesterday member statuses:')
        result.yesterday.members.forEach((m: any) => {
          console.log(`  - ${m.namaLengkap}: "${m.status}" (kelompok: ${m.namaKelompok})`)
        })
        
        // Group members by kelompok for easier display
        const processData = (info: RondaInfo) => {
          console.log('Processing info, members count:', info.members.length)
          console.log('Member statuses from API:', info.members.map(m => ({ 
            name: m.namaLengkap, 
            status: m.status 
          })))
          
          const groupedMembers = info.members.reduce((acc, member) => {
            if (!acc[member.kelompokId]) {
              acc[member.kelompokId] = []
            }
            acc[member.kelompokId].push({
              namaLengkap: member.namaLengkap,
              jabatan: member.jabatan,
              status: member.status as any,
              check_in: member.check_in,
              check_out: member.check_out,
            })
            return acc
          }, {} as Record<number, Member[]>)

          return {
            ...info,
            groups: info.groups.map(group => ({
              ...group,
              members: groupedMembers[group.id] || []
            }))
          }
        }

        setData({
          today: processData(result.today),
          yesterday: processData(result.yesterday)
        })
        
        console.log('=== DATA PROCESSED ===')
      } else {
        setError(result.message || "Gagal memuat data kelompok ronda")
      }
    } catch (err) {
      console.error("Error fetching ronda info:", err)
      setError("Gagal memuat data kelompok ronda")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    // Normalisasi status (case insensitive)
    const normalizedStatus = status ? status.trim() : ''
    
    const statusConfig = {
      "hadir": { variant: "default" as const, className: "bg-primary text-white", label: "Hadir" },
      "izin": { variant: "secondary" as const, className: "bg-blue-500 text-white", label: "Izin" },
      "sakit": { variant: "secondary" as const, className: "bg-yellow-500 text-white", label: "Sakit" },
      "alpha": { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Alpha" },
      "tidak hadir": { variant: "destructive" as const, className: "bg-red-500 text-white", label: "Alpha" },
    }
    
    // Cari config berdasarkan lowercase
    const config = statusConfig[normalizedStatus.toLowerCase() as keyof typeof statusConfig]
    
    // Log untuk debugging
    console.log(`Status badge - Input: "${status}", Normalized: "${normalizedStatus}", Found config:`, !!config)
    
    if (!config) {
      console.warn(`Unknown status: "${status}", showing as is`)
      return (
        <Badge variant="secondary" className="bg-gray-400 text-white">
          {status}
        </Badge>
      )
    }
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-"
    try {
      // MySQL DATETIME format: "2025-11-05 10:35:30"
      // Kita hanya perlu ekstrak jam:menit
      const match = dateString.match(/(\d{2}):(\d{2})/)
      if (match) {
        return `${match[1]}:${match[2]}`
      }
      return "-"
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, dd MMMM yyyy", { locale: id })
    } catch {
      return dateString
    }
  }

  const getParticipationPercentage = (group: KelompokRonda) => {
    if (group.totalAnggota === 0) return 0
    return Math.round((group.hadirCount / group.totalAnggota) * 100)
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Memuat informasi kelompok ronda...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Tidak ada data kelompok ronda
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderGroupTable = (groups: KelompokRonda[], showMembers: boolean = true) => (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  {group.namaKelompok}
                </CardTitle>
                {group.jadwalHari && (
                  <CardDescription className="text-xs sm:text-sm mt-1">{group.jadwalHari}</CardDescription>
                )}
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {getParticipationPercentage(group)}%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Partisipasi</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4">
              <div className="text-center p-2 sm:p-3 bg-primary/10 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-primary">{group.hadirCount}</div>
                <div className="text-xs sm:text-sm text-primary">Hadir</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{group.izinCount}</div>
                <div className="text-xs sm:text-sm text-blue-700">Izin</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{group.sakitCount}</div>
                <div className="text-xs sm:text-sm text-yellow-700">Sakit</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{group.alphaCount}</div>
                <div className="text-xs sm:text-sm text-red-700">Alpha</div>
              </div>
            </div>

            {/* Members Table */}
            {showMembers && group.members && group.members.length > 0 && (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Nama</TableHead>
                      {userRole !== "warga" && <TableHead className="text-xs sm:text-sm">Jabatan</TableHead>}
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      {userRole !== "warga" && <TableHead className="text-center text-xs sm:text-sm">Check-in</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.members
                      .filter(m => m.status && m.status.trim() !== '') // Hanya tampilkan yang sudah diabsen
                      .map((member, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-xs sm:text-sm">{member.namaLengkap}</TableCell>
                          {userRole !== "warga" && (
                            <TableCell className="text-xs sm:text-sm text-muted-foreground">
                              {member.jabatan || "-"}
                            </TableCell>
                          )}
                          <TableCell className="text-xs sm:text-sm">{getStatusBadge(member.status)}</TableCell>
                          {userRole !== "warga" && (
                            <TableCell className="text-center font-mono text-xs sm:text-sm">
                              {formatTime(member.check_in)}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {showMembers && (!group.members || group.members.filter(m => m.status).length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data anggota untuk kelompok ini
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            Informasi Kelompok Ronda
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Menampilkan kelompok ronda yang terjadwal hari ini dan kemarin sesuai jadwal masing-masing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="today" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background">
                <span className="hidden sm:inline">Hari Ini ({formatDate(data.today.date)})</span>
                <span className="sm:hidden">Hari Ini</span>
              </TabsTrigger>
              <TabsTrigger value="yesterday" className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-background">
                <span className="hidden sm:inline">Kemarin ({formatDate(data.yesterday.date)})</span>
                <span className="sm:hidden">Kemarin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {data.today.groups.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">
                        Menampilkan {data.today.groups.length} kelompok yang terjadwal ronda hari ini
                      </span>
                    </div>
                  </div>
                  {renderGroupTable(data.today.groups)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">Tidak ada kelompok ronda yang terjadwal hari ini</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Semua kelompok ronda sedang libur</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="yesterday" className="space-y-4">
              {data.yesterday.groups.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CalendarDays className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium">
                        Menampilkan {data.yesterday.groups.length} kelompok yang terjadwal ronda kemarin
                      </span>
                    </div>
                  </div>
                  {renderGroupTable(data.yesterday.groups)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-muted-foreground font-medium">Tidak ada kelompok ronda yang terjadwal kemarin</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Semua kelompok ronda sedang libur</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            Ringkasan Partisipasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Hari Ini</div>
              <div className="text-xl sm:text-2xl font-bold">
                {data.today.groups.reduce((acc, group) => acc + group.hadirCount, 0)} / {data.today.groups.reduce((acc, group) => acc + group.totalAnggota, 0)} Hadir
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total {data.today.groups.length} kelompok ronda aktif
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">Kemarin</div>
              <div className="text-xl sm:text-2xl font-bold">
                {data.yesterday.groups.reduce((acc, group) => acc + group.hadirCount, 0)} / {data.yesterday.groups.reduce((acc, group) => acc + group.totalAnggota, 0)} Hadir
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total {data.yesterday.groups.length} kelompok ronda aktif
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
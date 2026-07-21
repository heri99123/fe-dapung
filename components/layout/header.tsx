"use client"
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  UserCheck,
  Building,
  Menu,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api"

interface HeaderProps {
  title: string
  subtitle?: string
  onOpenMenu?: () => void
  userRole?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  timestamp: string
  read: boolean
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: "warga" | "petugas" | "rumah" | "transaksi"
  url: string
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Donasi Baru",
    message: "Anda menerima donasi sebesar Rp 500.000 dari Ahmad Rizki",
    type: "success",
    timestamp: "2 menit yang lalu",
    read: false,
  },
  {
    id: "2",
    title: "Target Tercapai",
    message: 'Kampanye "Bantuan Pendidikan" telah mencapai 75% dari target',
    type: "info",
    timestamp: "1 jam yang lalu",
    read: false,
  },
  {
    id: "3",
    title: "Peringatan",
    message: 'Kampanye "Renovasi Masjid" akan berakhir dalam 3 hari',
    type: "warning",
    timestamp: "3 jam yang lalu",
    read: false,
  },
]

export function Header({ title, subtitle, onOpenMenu, userRole }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResults([])
      setIsSearching(false)
    } else {
      performSearch(searchQuery)
    }
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const API_URL = "https://be-kesorga.vmp.my.id/api"
      const results: SearchResult[] = []

      // Search Warga
      try {
        const wargaRes = await apiClient.get(`/warga?_t=${Date.now()}`)
        const wargaData = await wargaRes.data as any
        if (wargaData.success && Array.isArray(wargaData.data)) {
          wargaData.data
            .filter((w: any) => 
              w.namaLengkap?.toLowerCase().includes(query.toLowerCase()) ||
              w.nik?.includes(query) ||
              w.nomorHp?.includes(query)
            )
            .forEach((w: any) => {
              results.push({
                id: `w-${w.id}`,
                title: w.namaLengkap || 'Tanpa Nama',
                subtitle: `NIK: ${w.nik || '-'} • ${w.nomorHp || '-'}`,
                type: "warga",
                url: `/data-warga?highlight=${w.id}`,
              })
            })
        }
      } catch (error) {
        // console.error('Error searching warga:', error)
      }

      // Search Petugas
      try {
        const petugasRes = await apiClient.get(`${API_URL}/petugas?_t=${Date.now()}`)
        const petugasData = await petugasRes.data as any
        if (petugasData.success && Array.isArray(petugasData.data)) {
          petugasData.data
            .filter((p: any) => 
              p.namaLengkap?.toLowerCase().includes(query.toLowerCase()) ||
              p.username?.toLowerCase().includes(query.toLowerCase()) ||
              p.nomorHp?.includes(query)
            )
            .forEach((p: any) => {
              results.push({
                id: `p-${p.id}`,
                title: p.namaLengkap || p.username || 'Tanpa Nama',
                subtitle: `Username: ${p.username || '-'} • ${p.role || '-'}`,
                type: "petugas",
                url: `/data-petugas?highlight=${p.id}`,
              })
            })
        }
      } catch (error) {
        // console.error('Error searching petugas:', error)
      }

      // Search Rumah
      try {
        const rumahRes = await apiClient.get(`/rumah?_t=${Date.now()}`)
        const rumahData = await rumahRes.data as any
        if (rumahData.success && Array.isArray(rumahData.data)) {
          rumahData.data
            .filter((r: any) => 
              r.alamat?.toLowerCase().includes(query.toLowerCase()) ||
              r.rt?.includes(query) ||
              r.rw?.includes(query)
            )
            .forEach((r: any) => {
              results.push({
                id: `r-${r.id}`,
                title: r.alamat || 'Tanpa Alamat',
                subtitle: `RT ${r.rt || '-'} / RW ${r.rw || '-'} • Kode: ${r.kodeRumah || '-'}`,
                type: "rumah",
                url: `/data-rumah?highlight=${r.id}`,
              })
            })
        }
      } catch (error) {
        // console.error('Error searching rumah:', error)
      }

      // Search Transaksi
      try {
        const transaksiRes = await apiClient.get(`/transaksi?_t=${Date.now()}`)
        const transaksiData = await transaksiRes.data as any
        if (transaksiData.success && Array.isArray(transaksiData.data)) {
          transaksiData.data
            .filter((t: any) => 
              t.namaWarga?.toLowerCase().includes(query.toLowerCase()) ||
              t.jenisDana?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10) // Limit to 10 results
            .forEach((t: any) => {
              const nominal = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(t.nominal || 0)
              
              results.push({
                id: `t-${t.id}`,
                title: `${t.namaWarga || 'Warga'} - ${t.jenisDana || 'Dana'}`,
                subtitle: `${nominal} • ${new Date(t.tanggal_setor).toLocaleDateString('id-ID')}`,
                type: "transaksi",
                url: `/transaksi-dana?highlight=${t.id}`,
              })
            })
        }
      } catch (error) {
        // console.error('Error searching transaksi:', error)
      }

      setFilteredResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }



  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser")
      window.location.href = "/"
    } catch (error) {
      console.log("Error during logout")
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    window.location.href = result.url
    setSearchOpen(false)
    setSearchQuery("")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warga":
        return <Users className="h-4 w-4 text-blue-500" />
      case "petugas":
        return <UserCheck className="h-4 w-4 text-primary" />
      case "rumah":
        return <Building className="h-4 w-4 text-purple-500" />
      case "transaksi":
        return <span className="h-4 w-4 text-yellow-600 font-semibold flex items-center justify-center">Rp</span>
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "warga":
        return "Data Warga"
      case "petugas":
        return "Data Petugas"
      case "rumah":
        return "Data Rumah"
      case "transaksi":
        return "Transaksi Dana"
      default:
        return "Data"
    }
  }

  return (
    <>
      <header className="flex h-14 sm:h-16 items-center justify-between border-b bg-card px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 sm:h-10 sm:w-10" aria-label="Buka menu" onClick={onOpenMenu}>
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-card-foreground truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {userRole !== 'warga' && (
            <Button
              variant="outline"
              className="relative hidden md:flex w-40 lg:w-64 justify-start text-sm text-muted-foreground bg-transparent"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Cari data...</span>
              <span className="lg:hidden">Cari...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}
          {userRole !== 'warga' && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs">{unreadCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[95vw] max-w-md sm:w-96">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="text-sm sm:text-base p-0">Notifikasi</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 px-2">
                    Tandai
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada notifikasi</div>
              ) : (
                <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-start gap-2">
                            <p className="font-medium text-xs sm:text-sm flex-1 break-words leading-snug">{notification.title}</p>
                            {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 break-words">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="w-full text-center">
                  Lihat Semua Notifikasi
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Pengaturan</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings?tab=profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil Saya</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan Lengkap</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Pencarian Global</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              placeholder="Cari warga, petugas, rumah, atau transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>

          {searchQuery.trim() === "" ? (
            <div className="mt-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ketik untuk mencari semua data dalam sistem</p>
              <p className="text-sm mt-2">Warga, Petugas, Rumah, dan Transaksi</p>
            </div>
          ) : isSearching ? (
            <div className="mt-6 text-center text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p>Mencari data...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="mt-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada hasil untuk "{searchQuery}"</p>
              <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <div className="text-sm text-muted-foreground mb-4">Ditemukan {filteredResults.length} hasil</div>

              {["warga", "petugas", "rumah", "transaksi"].map((type) => {
                const resultsOfType = filteredResults.filter((result) => result.type === type)
                if (resultsOfType.length === 0) return null

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      {getTypeIcon(type)}
                      {getTypeLabel(type)} ({resultsOfType.length})
                    </div>

                    {resultsOfType.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(result.type)}
                              <h3 className="font-semibold">{result.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Gunakan <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> untuk membuka pencarian cepat
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

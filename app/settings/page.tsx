"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Check,
} from "lucide-react"
import type { User as UserType } from "@/types/auth"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"


// Daftar tema warna yang tersedia
const themes = [
  { id: "green", name: "Hijau", color: "#4caf50" },
  { id: "blue", name: "Biru", color: "#2196f3" },
  { id: "purple", name: "Ungu", color: "#9c27b0" },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [currentTheme, setCurrentTheme] = useState("green")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"

  const [profileForm, setProfileForm] = useState({
    nama: "",
    email: "",
    phone: "",
    alamat: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      setProfileForm({
        nama: parsedUser.nama || "",
        email: parsedUser.email || "",
        phone: parsedUser.nomorHp || "",
        alamat: parsedUser.alamat || "",
      })

      // Load tema yang disimpan GLOBAL PER WARGA - menggunakan id_warga
      // Gunakan id_warga untuk konsistensi tema di semua role
      const globalUserId = parsedUser.id_warga || parsedUser.id
      const userThemeKey = `appTheme_global_${globalUserId}`
      const savedTheme = localStorage.getItem(userThemeKey)
      const validTheme = savedTheme && themes.find(t => t.id === savedTheme) ? savedTheme : "green"
      console.log("🎨 Loading saved theme for global user ID", globalUserId, "(", parsedUser.nama, "):", { savedTheme, validTheme, key: userThemeKey, role: parsedUser.role })
      setCurrentTheme(validTheme)
      applyTheme(validTheme)

      // Force light mode - dark mode dihapus
      document.documentElement.classList.remove("dark")
    }

    // Load notification preferences
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      try {
        const prefs = JSON.parse(savedNotifications)
        setNotificationsEnabled(prefs.enabled ?? true)
        setEmailNotifications(prefs.email ?? true)
        setPushNotifications(prefs.push ?? true)
      } catch (error) {
        console.error("Error loading notification preferences:", error)
      }
    }

    const savedSound = localStorage.getItem("soundEnabled")
    setSoundEnabled(savedSound === "true" || savedSound === null)
  }, [])

  const applyTheme = (themeId: string) => {
    console.log("🎨 Applying theme:", themeId)
    document.documentElement.setAttribute("data-theme", themeId)
    
    // Apply CSS variables untuk tema
    const theme = themes.find(t => t.id === themeId)
    if (theme) {
      document.documentElement.style.setProperty("--theme-color", theme.color)
    }
  }

  const handleThemeChange = (themeId: string) => {
    console.log("🎨 Changing theme to:", themeId)
    setCurrentTheme(themeId)
    
    // Simpan tema GLOBAL - gunakan id_warga untuk konsistensi di semua role
    if (user) {
      const globalUserId = (user as any).id_warga || user.id
      const userThemeKey = `appTheme_global_${globalUserId}`
      localStorage.setItem(userThemeKey, themeId)
      console.log("🎨 Theme saved globally for user", globalUserId, "(", user.nama, "):", themeId, "Key:", userThemeKey, "Role:", user.role)
    }
    
    applyTheme(themeId)
    
    toast({
      title: "Tema Berhasil Diubah",
      description: `Tema ${themes.find((t) => t.id === themeId)?.name} telah diterapkan dan disimpan untuk semua role Anda.`,
    })
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      const response = await apiClient.put(`/user/profile`, {
          id: user.id,
          role: user.role,
          nama: profileForm.nama,
          email: profileForm.email,
          phone: profileForm.phone,
          alamat: profileForm.alamat,
      })


      if (response.success) {
        const updatedUser = { ...user, ...profileForm, nomorHp: profileForm.phone }
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
        setUser(updatedUser)

        toast({
          title: "Profil Berhasil Diperbarui",
          description: "Data profil Anda telah disimpan.",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      toast({
        title: "Gagal Memperbarui Profil",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePassword = async () => {
    if (!user) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Password baru dan konfirmasi password harus sama.",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword.length < 4) {
      toast({
        title: "Password Terlalu Pendek",
        description: "Password minimal 4 karakter.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Tentukan endpoint berdasarkan role
      // Role warga menggunakan endpoint warga, role lainnya (petugas, admin, superadmin) menggunakan endpoint petugas
      const endpoint =
        user.role === "warga"
          ? `/user/warga/change-password`
          : `/user/petugas/change-password`

      // Tentukan request body berdasarkan role
      const requestBody =
        user.role === "warga"
          ? {
              id_warga: parseInt(user.id),
              currentPassword: passwordForm.currentPassword,
              newPassword: passwordForm.newPassword,
            }
          : {
              id_petugas: parseInt(user.id),
              currentPassword: passwordForm.currentPassword,
              newPassword: passwordForm.newPassword,
            }

      console.log("Change password request:", {
        role: user.role,
        endpoint,
        requestBody: { ...requestBody, currentPassword: "***", newPassword: "***" }
      })

      const response = await apiClient.post(endpoint, requestBody)


      console.log("Change password response:", response.data)

      if (response.success) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })

        toast({
          title: "Password Berhasil Diubah",
          description: "Password Anda telah diperbarui. Silakan login dengan password baru.",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Gagal Mengubah Password",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = () => {
    const prefs = {
      enabled: notificationsEnabled,
      email: emailNotifications,
      push: pushNotifications,
    }
    localStorage.setItem("notifications", JSON.stringify(prefs))
    localStorage.setItem("soundEnabled", soundEnabled.toString())

    toast({
      title: "Pengaturan Notifikasi Disimpan",
      description: "Preferensi notifikasi Anda telah diperbarui.",
    })
  }

  return (
    <DashboardLayout title="Pengaturan">
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifikasi
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Keamanan
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Tampilan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Kelola informasi pribadi dan detail kontak Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {user?.nama?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.nama}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {user?.role?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={profileForm.nama}
                      onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat</Label>
                    <Input
                      id="alamat"
                      value={profileForm.alamat}
                      onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Notifikasi</CardTitle>
                <CardDescription>Kelola bagaimana Anda menerima notifikasi dan pembaruan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Aktifkan Notifikasi</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi untuk aktivitas penting</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Email Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Push Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi push di perangkat</p>
                      </div>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Suara Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Putar suara untuk notifikasi</p>
                      </div>
                    </div>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} disabled={!notificationsEnabled} />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>Kelola password dan pengaturan keamanan akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Masukkan password saat ini"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Masukkan password baru (min. 4 karakter)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Ulangi password baru"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSavePassword} 
                  disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword} 
                  className="w-full md:w-auto"
                >
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Ubah Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Login</CardTitle>
                <CardDescription>Riwayat login dan aktivitas keamanan terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Login dari Chrome</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString("id-ID")} - Jakarta, Indonesia
                          </p>
                        </div>
                      </div>
                      <Badge variant={i === 1 ? "default" : "secondary"}>{i === 1 ? "Aktif" : "Selesai"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Tampilan</CardTitle>
                <CardDescription>Sesuaikan tampilan dan tema aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base">Tema Warna</Label>
                  <p className="text-sm text-muted-foreground mb-3">Pilih warna tema yang Anda suka</p>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                          currentTheme === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className="w-full h-8 rounded mb-2"
                          style={{ backgroundColor: theme.color }}
                        ></div>
                        <p className="text-sm font-medium text-center">{theme.name}</p>
                        {currentTheme === theme.id && (
                          <div className="flex items-center justify-center gap-1 text-xs text-primary mt-1">
                            <Check className="h-3 w-3" />
                            Aktif
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, User, Lock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function LoginTransaksiPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "petugas"
  })
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Username dan password wajib diisi",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      // Simulasi login - nanti bisa diganti dengan API real
      // Untuk sementara, hardcode beberapa user petugas
      const validUsers = [
        { username: "petugas1", password: "123456", name: "Ahmad Petugas", id: "1" },
        { username: "petugas2", password: "123456", name: "Siti Petugas", id: "2" },
        { username: "admin", password: "admin123", name: "Admin Sistem", id: "3" }
      ]

      const user = validUsers.find(u => 
        u.username === formData.username && u.password === formData.password
      )

      if (user) {
        // Simpan data petugas di localStorage
        const petugasData = {
          id: user.id,
          name: user.name,
          username: user.username,
          role: formData.role,
          loginTime: new Date().toISOString()
        }
        
        localStorage.setItem("petugasLogin", JSON.stringify(petugasData))
        
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${user.name}`,
        })
        
        // Redirect ke halaman transaksi
        router.push("/transaksi-dana")
      } else {
        toast({
          title: "Login Gagal",
          description: "Username atau password salah",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Login Petugas</CardTitle>
          <CardDescription>
            Masuk untuk melakukan transaksi dana jimpitan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petugas">Petugas</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo Credentials:</p>
            <p>Username: <code className="bg-gray-100 px-1 rounded">petugas1</code></p>
            <p>Password: <code className="bg-gray-100 px-1 rounded">123456</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
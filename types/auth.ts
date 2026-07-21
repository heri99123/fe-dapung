export type UserRole = "warga" | "petugas" | "admin" | "super_admin"

export interface User {
  id: string
  id_warga?: string // Global identifier untuk tema dan preferensi lintas role
  nama: string
  role: UserRole
  username?: string
  nomorHp?: string
  email?: string
  alamat?: string
  kelompokRonda?: string
  isActive: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

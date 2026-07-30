"use client"

// import { useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import type { User } from "@/types/auth"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  // useEffect(() => {
  //   try {
  //     localStorage.removeItem("currentUser")
  //   } catch {}
  // }, [])

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
    
    // Redirect semua user ke dashboard utama yang sudah ada
    router.push("/dashboard")
  }

  return <LoginForm onLogin={handleLogin} />
}

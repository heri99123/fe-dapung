"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import type { User } from "@/types/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { menuItems } from "./sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (!savedUser) {
      router.push("/")
      return
    }
    setUser(JSON.parse(savedUser))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const handleRoleSwitch = () => {
    // In a real app, this would show a role selection modal
    // For now, just redirect to login
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} onLogout={handleLogout} onRoleSwitch={handleRoleSwitch} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} onOpenMenu={() => setMobileOpen(true)} userRole={user.role} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Menu</DrawerTitle>
          </DrawerHeader>
          <nav className="p-4 space-y-2">
            {menuItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <item.icon className="h-4 w-4 mr-3" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              ))}
            <div className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full bg-transparent">
                  Tutup
                </Button>
              </DrawerClose>
            </div>
          </nav>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

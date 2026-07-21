"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AttendanceTracker } from "@/components/attendance/attendance-tracker"
import { AttendanceManagement } from "@/components/attendance/attendance-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/types/database"

export default function AbsensiPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (!user) {
    return (
      <DashboardLayout title="Absensi">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Absensi">
      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Absensi</TabsTrigger>
          <TabsTrigger value="management">Kelola Absensi</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <AttendanceTracker user={user} />
        </TabsContent>

        <TabsContent value="management">
          <AttendanceManagement currentUser={user} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

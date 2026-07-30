"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCircle, AlertCircle, Clock, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  timestamp: string
  read: boolean
}

const allNotifications: Notification[] = [
  {
    id: "1",
    title: "Donasi Baru",
    message: 'Anda menerima donasi sebesar Rp 500.000 dari Ahmad Rizki untuk kampanye "Bantuan Pendidikan Anak Yatim"',
    type: "success",
    timestamp: "2 menit yang lalu",
    read: false,
  },
  {
    id: "2",
    title: "Target Tercapai",
    message: 'Kampanye "Bantuan Pendidikan" telah mencapai 75% dari target sebesar Rp 10.000.000',
    type: "info",
    timestamp: "1 jam yang lalu",
    read: false,
  },
  {
    id: "3",
    title: "Peringatan",
    message: 'Kampanye "Renovasi Masjid" akan berakhir dalam 3 hari. Pastikan untuk mempromosikan kampanye ini.',
    type: "warning",
    timestamp: "3 jam yang lalu",
    read: false,
  },
  {
    id: "4",
    title: "Donasi Berhasil",
    message: "Donasi sebesar Rp 250.000 dari Siti Nurhaliza telah berhasil diproses",
    type: "success",
    timestamp: "1 hari yang lalu",
    read: true,
  },
  {
    id: "5",
    title: "Kampanye Baru",
    message: 'Kampanye "Bantuan Korban Bencana" telah berhasil dibuat dan dipublikasikan',
    type: "info",
    timestamp: "2 hari yang lalu",
    read: true,
  },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>(allNotifications)

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-primary" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`mb-3 sm:mb-4 ${!notification.read ? "border-l-4 border-l-blue-500 bg-muted/30" : ""}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-xs sm:text-sm">{notification.title}</h3>
                {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{notification.message}</p>
              <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-7 sm:ml-0">
            {!notification.read && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs h-8">
                Tandai Dibaca
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNotification(notification.id)}
              className="text-destructive hover:text-destructive h-8 px-2"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-3 sm:mb-4 px-2 sm:px-4 text-xs sm:text-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-xl sm:text-2xl font-bold">Notifikasi</h1>
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadNotifications.length} belum dibaca</Badge>
            )}
          </div>
          {unreadNotifications.length > 0 && (
            <Button onClick={markAllAsRead} variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Semua ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm">Belum Dibaca ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="read" className="text-xs sm:text-sm">Sudah Dibaca ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Tidak ada notifikasi</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Semua notifikasi sudah dibaca</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Tidak ada notifikasi yang sudah dibaca</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

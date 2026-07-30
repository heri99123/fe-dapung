"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Building2,
  Users,
  UserCheck,
  Wallet,
  Shield,
  Receipt,
  BarChart3,
  QrCode,
  ClipboardCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Banknote,
} from "lucide-react";
import type { User, UserRole } from "@/types/auth";

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onRoleSwitch: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

export const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["warga", "petugas", "admin", "super_admin"],
  },
  {
    title: "Data Transaksi",
    href: "/data-transaksi",
    icon: Banknote,
    roles: ["warga"],
  },
  {
    title: "Data Rumah",
    href: "/data-rumah",
    icon: Building2,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Data Warga",
    href: "/data-warga",
    icon: Users,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Data Petugas",
    href: "/data-petugas",
    icon: UserCheck,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Jenis Dana",
    href: "/jenis-dana",
    icon: Wallet,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Kelompok Ronda",
    href: "/kelompok-ronda",
    icon: Shield,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Transaksi Dana",
    href: "/transaksi-dana",
    icon: Banknote,
    roles: ["admin", "super_admin", "petugas"],
  },
  {
    title: "Scan Barcode",
    href: "/scan-barcode",
    icon: QrCode,
    roles: ["petugas"],
  },
  {
    title: "Absensi",
    href: "/absensi",
    icon: ClipboardCheck,
    roles: ["petugas", "admin", "super_admin"],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: BarChart3,
    roles: ["admin", "super_admin"],
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ["warga", "petugas", "admin", "super_admin"],
  },
];

export function Sidebar({ user, onLogout, onRoleSwitch }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <div
      className={cn(
        "hidden lg:flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg">
              <Image
                src="/logo-dapung.png"
                alt="Dapung Logo"
                className="w-full h-full object-contain"
                width={100}
                height={100}
                priority
              />
            </div>
            {/* <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">KeSorga</h2>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div> */}
          </div>
        )}
        {/* {collapsed && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg">
            <Image
              src="/logo-depan.jpeg"
              alt="KeSorga Logo"
              width={40}
              height={40}
              priority
            />
          </div>
        )} */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.nama?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.nama}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRoleSwitch}
                className="flex-1 text-xs bg-transparent"
              >
                Pindah Role
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex-1 text-xs bg-transparent"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent mb-1.5",
                    collapsed ? "px-2" : "px-3",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authenticateUser } from "@/lib/auth";
import type { User } from "@/types/auth";
import { Eye, EyeOff, Loader2, Phone, UserIcon } from "lucide-react";
import Image from "next/image";

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const themeColors: Record<string, string> = {
  green: "#4caf50",
  blue: "#2196f3",
  purple: "#9c27b0",
};

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("green");

  const [phoneLogin, setPhoneLogin] = useState({
    nomorHp: "",
    password: "",
  });

  const [usernameLogin, setUsernameLogin] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    // Load tema global dari localStorage berdasarkan user terakhir (jika ada)
    // Ini opsional untuk login form, hanya untuk konsistensi visual
    const savedUser = localStorage.getItem("currentUser");
    let savedTheme = "green";

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const globalUserId = parsedUser.id_warga || parsedUser.id;
        const userThemeKey = `appTheme_global_${globalUserId}`;
        savedTheme = localStorage.getItem(userThemeKey) || "green";
      } catch (e) {
        console.error("Error loading user theme:", e);
      }
    }

    const validTheme =
      savedTheme && themeColors[savedTheme] ? savedTheme : "green";
    setCurrentTheme(validTheme);
  }, []);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await authenticateUser(
        phoneLogin.nomorHp,
        phoneLogin.password,
        "phone",
      );
      if (user) {
        onLogin(user);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await authenticateUser(
        usernameLogin.username,
        usernameLogin.password,
        "username",
      );
      if (user) {
        onLogin(user);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const themeColor = themeColors[currentTheme] || themeColors.green;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4 md:p-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-0 flex h-48 items-center justify-center rounded-lg">
            <Image
              src="/logo-depan.jpeg"
              alt="Dapung Logo"
              width={100}
              height={100}
              priority
              className="w-full h-full object-contain"
              style={{
                filter: `hue-rotate(${currentTheme === "green" ? 0 : currentTheme === "blue" ? 190 : 270}deg)`,
              }}
            />
          </div>
          {/* <CardTitle className="text-xl sm:text-2xl font-bold mt-2">KeSorga</CardTitle>
          <CardDescription className="text-sm sm:text-base">Kegiatan Sosial Infaq Keluarga</CardDescription> */}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="warga" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="warga" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Warga
              </TabsTrigger>
              <TabsTrigger value="petugas" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Petugas/Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warga">
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phoneLogin.nomorHp}
                    onChange={(e) =>
                      setPhoneLogin((prev) => ({
                        ...prev,
                        nomorHp: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="phone-password"
                      type={showPhonePassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={phoneLogin.password}
                      onChange={(e) =>
                        setPhoneLogin((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPhonePassword(!showPhonePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPhonePassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{ backgroundColor: themeColor }}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Masuk sebagai Warga
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="petugas">
              <form onSubmit={handleUsernameLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={usernameLogin.username}
                    onChange={(e) =>
                      setUsernameLogin((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="username-password"
                      type={showUsernamePassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={usernameLogin.password}
                      onChange={(e) =>
                        setUsernameLogin((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowUsernamePassword(!showUsernamePassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showUsernamePassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{ backgroundColor: themeColor }}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Masuk sebagai Petugas/Admin
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

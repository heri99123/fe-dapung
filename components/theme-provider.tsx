'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Load current user untuk mendapatkan tema global per warga
    const savedUser = localStorage.getItem("currentUser")
    let globalUserId = null
    let userName = "Unknown"
    let userRole = "unknown"
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        // Gunakan id_warga untuk global identifier, fallback ke id jika tidak ada
        globalUserId = parsedUser.id_warga || parsedUser.id
        userName = parsedUser.nama || "Unknown"
        userRole = parsedUser.role || "unknown"
      } catch (e) {
        console.error("Error parsing user:", e)
      }
    }

    // Load dan apply custom theme (green, blue, purple) GLOBAL
    const userThemeKey = globalUserId ? `appTheme_global_${globalUserId}` : "appTheme"
    const savedTheme = localStorage.getItem(userThemeKey)
    
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme)
      
      // Apply CSS variables untuk tema
      const themes: Record<string, string> = {
        green: "#4caf50",
        blue: "#2196f3",
        purple: "#9c27b0",
      }
      
      const themeColor = themes[savedTheme]
      if (themeColor) {
        document.documentElement.style.setProperty("--theme-color", themeColor)
      }
      
      console.log("🎨 Global theme loaded for user ID", globalUserId, "(", userName, ", role:", userRole, "):", savedTheme, "Key:", userThemeKey)
    } else {
      // Default theme hijau jika tidak ada tema tersimpan
      document.documentElement.setAttribute("data-theme", "green")
      document.documentElement.style.setProperty("--theme-color", "#4caf50")
      console.log("🎨 Default theme loaded for user ID", globalUserId, "(", userName, ", role:", userRole, "): green")
    }

    // FORCE LIGHT MODE - Dark mode dihapus
    document.documentElement.classList.remove("dark")
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

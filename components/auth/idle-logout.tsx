"use client"

import { useEffect, useRef } from "react"

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000 // 10 minutes

export function IdleLogout() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const hasUser = typeof window !== "undefined" && !!localStorage.getItem("currentUser")

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const startTimer = () => {
      clearTimer()
      timerRef.current = window.setTimeout(() => {
        try {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser")
        } catch {}
        window.location.href = "/"
      }, INACTIVITY_LIMIT_MS)
    }

    const onActivity = () => {
      if (!localStorage.getItem("currentUser")) return
      startTimer()
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "currentUser") {
        if (e.newValue === null) {
          window.location.href = "/"
        } else {
          startTimer()
        }
      }
    }

    if (hasUser) startTimer()

    // ✅ window events
    const windowEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ]

    // ✅ tambahkan listener window
    windowEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }))

    // ✅ tambahkan listener khusus untuk document
    document.addEventListener("visibilitychange", onActivity)

    window.addEventListener("storage", onStorage)

    return () => {
      clearTimer()
      windowEvents.forEach((ev) => window.removeEventListener(ev, onActivity))
      document.removeEventListener("visibilitychange", onActivity)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return null
}

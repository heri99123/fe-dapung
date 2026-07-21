export const generateBarcodeData = (rumahId: string, alamat: string): string => {
  const timestamp = Date.now().toString(36)
const houseCode = rumahId.toString().padStart(3, "0")
  return `RMH${houseCode}${timestamp.slice(-4)}`
}

export const generateBarcodeUrl = (data: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}

export const validateBarcodeFormat = (barcode: string): boolean => {
  // Lebih fleksibel - hanya cek apakah dimulai dengan RMH dan punya karakter setelahnya
  const pattern = /^RMH.+$/
  return pattern.test(barcode)
}

export const parseBarcodeData = (barcode: string): { rumahId: string; isValid: boolean } => {
  // Validasi lebih sederhana - hanya cek apakah dimulai dengan RMH
  if (!barcode.startsWith('RMH')) {
    return { rumahId: "", isValid: false }
  }

  // Extract rumah ID dari barcode (ambil angka setelah RMH)
  const match = barcode.match(/^RMH(\d+)/)
  const rumahId = match ? match[1].replace(/^0+/, "") || "1" : ""
  
  return { rumahId, isValid: true }
}

export const scanBarcode = async (): Promise<string | null> => {
  try {
    // Bersihkan element scanner sebelum memulai
    const scannerElement = document.getElementById("qr-reader")
    if (scannerElement) {
      scannerElement.innerHTML = ""
    }

    // Hindari SSR error dengan dynamic import
    const { Html5QrcodeScanner } = await import("html5-qrcode")

    return new Promise((resolve, reject) => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      )

      let scanned = false

      scanner.render(
        async (decodedText) => {
          if (!scanned) {
            scanned = true
            console.log("[v0] Barcode scanned:", decodedText)
            
            try {
              await scanner.clear()
              // Bersihkan lagi setelah clear untuk memastikan
              const element = document.getElementById("qr-reader")
              if (element) {
                element.innerHTML = ""
              }
            } catch (err) {
              console.error("[v0] Error clearing scanner:", err)
            }
            
            resolve(decodedText)
          }
        },
        (error) => {
          // Jangan log error terlalu sering, hanya log error penting
          if (!scanned && error && !error.includes("NotFoundException")) {
            console.log("[v0] QR scan error:", error)
          }
        },
      )

      // Auto stop setelah 60 detik (diperpanjang dari 30 detik)
      setTimeout(async () => {
        if (!scanned) {
          try {
            await scanner.clear()
            const element = document.getElementById("qr-reader")
            if (element) {
              element.innerHTML = ""
            }
          } catch (err) {
            console.error("[v0] Error clearing scanner on timeout:", err)
          }
          resolve(null)
        }
      }, 60000)
    })
  } catch (error) {
    console.error("[v0] Failed to initialize barcode scanner:", error)
    return null
  }
}

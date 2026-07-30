import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface ReportData {
  title: string
  period: string
  month: string
  year: string
  summary: {
    totalJimpitan: number
    totalTransaksi: number
    wargaBayar: number
    wargaBelumBayar: number
  }
  data: Array<{
    nama: string
    alamat: string
    rt: string
    rw: string
    totalBayar: number
    jumlahTransaksi: number
    sudahBayar: boolean
  }>
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const exportToPDF = (reportData: ReportData) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(reportData.title, 14, 20)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Periode: ${reportData.period} - ${reportData.month} ${reportData.year}`, 14, 28)
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 34)

  // Summary
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Ringkasan", 14, 44)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Total Jimpitan: ${formatCurrency(reportData.summary.totalJimpitan)}`, 14, 52)
  doc.text(`Total Transaksi: ${reportData.summary.totalTransaksi}`, 14, 58)
  doc.text(`Warga Sudah Bayar: ${reportData.summary.wargaBayar}`, 14, 64)
  doc.text(`Warga Belum Bayar: ${reportData.summary.wargaBelumBayar}`, 14, 70)

  // Table
  const tableData = reportData.data.map((item) => [
    item.nama,
    item.alamat,
    `RT ${item.rt} / RW ${item.rw}`,
    formatCurrency(item.totalBayar),
    item.jumlahTransaksi.toString(),
    item.sudahBayar ? "Sudah Bayar" : "Belum Bayar",
  ])

  autoTable(doc, {
    startY: 78,
    head: [["Nama", "Alamat", "RT/RW", "Total Bayar", "Transaksi", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
  })

  // Save PDF
  const fileName = `Laporan_Jimpitan_${reportData.month}_${reportData.year}.pdf`
  doc.save(fileName)
}

export const exportToExcel = (reportData: ReportData) => {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ["LAPORAN REKAPAN JIMPITAN"],
    [],
    ["Periode", `${reportData.period} - ${reportData.month} ${reportData.year}`],
    ["Tanggal Cetak", new Date().toLocaleDateString("id-ID")],
    [],
    ["RINGKASAN"],
    ["Total Jimpitan", formatCurrency(reportData.summary.totalJimpitan)],
    ["Total Transaksi", reportData.summary.totalTransaksi],
    ["Warga Sudah Bayar", reportData.summary.wargaBayar],
    ["Warga Belum Bayar", reportData.summary.wargaBelumBayar],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan")

  // Detail sheet
  const detailData = [
    ["Nama", "Alamat", "RT", "RW", "Total Bayar", "Jumlah Transaksi", "Status"],
    ...reportData.data.map((item) => [
      item.nama,
      item.alamat,
      item.rt,
      item.rw,
      item.totalBayar,
      item.jumlahTransaksi,
      item.sudahBayar ? "Sudah Bayar" : "Belum Bayar",
    ]),
  ]

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData)

  // Set column widths
  wsDetail["!cols"] = [
    { wch: 25 }, // Nama
    { wch: 35 }, // Alamat
    { wch: 8 }, // RT
    { wch: 8 }, // RW
    { wch: 15 }, // Total Bayar
    { wch: 15 }, // Jumlah Transaksi
    { wch: 15 }, // Status
  ]

  XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Rekap")

  // Save Excel
  const fileName = `Laporan_Jimpitan_${reportData.month}_${reportData.year}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export const exportToCSV = (reportData: ReportData) => {
  // Create CSV header
  const headers = ["Nama", "Alamat", "RT", "RW", "Total Bayar", "Jumlah Transaksi", "Status"]

  // Create CSV rows
  const rows = reportData.data.map((item) => [
    item.nama,
    item.alamat,
    item.rt,
    item.rw,
    item.totalBayar.toString(),
    item.jumlahTransaksi.toString(),
    item.sudahBayar ? "Sudah Bayar" : "Belum Bayar",
  ])

  // Combine headers and rows
  const csvContent = [
    [`"${reportData.title}"`],
    [`"Periode: ${reportData.period} - ${reportData.month} ${reportData.year}"`],
    [`"Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}"`],
    [],
    [`"Total Jimpitan: ${formatCurrency(reportData.summary.totalJimpitan)}"`],
    [`"Total Transaksi: ${reportData.summary.totalTransaksi}"`],
    [`"Warga Sudah Bayar: ${reportData.summary.wargaBayar}"`],
    [`"Warga Belum Bayar: ${reportData.summary.wargaBelumBayar}"`],
    [],
    headers.map((h) => `"${h}"`),
    ...rows.map((row) => row.map((cell) => `"${cell}"`)),
  ]
    .map((row) => row.join(","))
    .join("\n")

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `Laporan_Jimpitan_${reportData.month}_${reportData.year}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

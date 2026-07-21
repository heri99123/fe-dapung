"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TransactionList } from "@/components/transactions/transaction-list"

export default function TransaksiDanaPage() {
  return (
    <DashboardLayout title="Transaksi Dana">
      <TransactionList />
    </DashboardLayout>
  )
}

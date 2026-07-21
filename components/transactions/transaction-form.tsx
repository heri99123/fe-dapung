"use client"

import { useState } from "react"
import { createTransaksi } from "@/lib/transactions"

export default function TransactionForm() {
  const [formData, setFormData] = useState({
    id_warga: "",
    id_jenis: "",
    id_user: "2", // contoh: otomatis ambil dari user login
    tanggal_setor: new Date(),
    waktu_input: new Date(),
    nominal: 0,
    status_jimpitan: "belum_lunas" as "lunas" | "belum_lunas",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "nominal"
          ? Number(value)
          : name === "tanggal_setor"
          ? new Date(value)
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransaksi(formData)
      alert("Transaksi berhasil ditambahkan 🚀")
    } catch (err) {
      console.error(err)
      alert("Gagal menambahkan transaksi")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-md">
      <div>
        <label className="block mb-1">ID Warga</label>
        <input
          type="text"
          name="id_warga"
          value={formData.id_warga}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">ID Jenis Dana</label>
        <input
          type="text"
          name="id_jenis"
          value={formData.id_jenis}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Nominal</label>
        <input
          type="number"
          name="nominal"
          value={formData.nominal}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Tanggal Setor</label>
        <input
          type="date"
          name="tanggal_setor"
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full"
          required
        />
      </div>

      <div>
        <label className="block mb-1">Status Jimpitan</label>
        <select
          name="status_jimpitan"
          value={formData.status_jimpitan}
          onChange={handleChange}
          className="border px-2 py-1 rounded w-full"
        >
          <option value="lunas">Lunas</option>
          <option value="belum_lunas">Belum Lunas</option>
        </select>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Simpan Transaksi
      </button>
    </form>
  )
}

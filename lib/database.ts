import type {
  Rumah,
  Warga,
  User,
  JenisDana,
  KelompokRonda,
  Transaksi,
  Presensi,
  Petugas,
} from "@/types/database";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 detik

// Helper umum untuk request dengan caching
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    // Gunakan cache untuk GET requests
    // const isGetRequest =
    //   !options || !options.method || options.method === "GET";
    // const cacheKey = `${endpoint}_${JSON.stringify(options?.body || "")}`;

    // if (isGetRequest) {
    //   const cached = cache.get(cacheKey);
    //   if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    //     return cached.data as T;
    //   }
    // }

    const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      next: { revalidate: 30 }, // ISR revalidation setiap 30 detik
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    // parse JSON
    const payload = await res.json().catch(() => null);

    // Jika payload memiliki properti `data`, kembalikan payload.data
    let result: T;
    if (
      payload &&
      typeof payload === "object" &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      result = payload.data as T;
    } else {
      result = payload as T;
    }

    // Simpan ke cache untuk GET requests
    // if (isGetRequest) {
    //   cache.set(cacheKey, { data: result, timestamp: Date.now() });
    // }

    return result;
  } catch (error) {
    console.error(`Failed to fetch ${API_BASE_URL}/${endpoint}:`, error);
    throw new Error(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Function untuk clear cache (bisa dipanggil setelah create/update/delete)
export function clearCache() {
  cache.clear();
}

/* ==================== RUMAH ==================== */
export async function getAllRumah(): Promise<Rumah[]> {
  return apiRequest<Rumah[]>("rumah");
}

export async function createRumah(
  data: Omit<Rumah, "id" | "createdAt" | "updatedAt">
): Promise<Rumah | any> {
  return apiRequest<any>("rumah", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRumah(
  id: string,
  data: Partial<Rumah>
): Promise<Rumah | any> {
  return apiRequest<any>(`rumah/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getRumahById(id: string): Promise<Rumah> {
  return apiRequest<Rumah>(`rumah/${id}`);
}

export async function deleteRumah(id: string): Promise<void> {
  await apiRequest(`rumah/${id}`, { method: "DELETE" });
}

/* ==================== WARGA ==================== */
export async function getAllWarga(): Promise<Warga[]> {
  return apiRequest<Warga[]>("warga");
}

export async function getKepalaKeluarga(): Promise<Warga[]> {
  return apiRequest<Warga[]>("warga/kepala-keluarga");
}

export async function createWarga(
  data: Omit<Warga, "id" | "createdAt" | "updatedAt">
): Promise<Warga | any> {
  return apiRequest<any>("warga", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWarga(
  id: string,
  data: Partial<Warga>
): Promise<Warga | any> {
  return apiRequest<any>(`warga/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWarga(id: string): Promise<void> {
  await apiRequest(`warga/${id}`, { method: "DELETE" });
}

export async function getWargaByBarcode(
  barcode: string
): Promise<Warga | null> {
  try {
    const warga = await apiRequest<Warga>(`warga/barcode/${barcode}`);
    return warga;
  } catch (error) {
    console.error("Gagal mengambil data warga berdasarkan barcode:", error);
    return null;
  }
}

/* ==================== PETUGAS ==================== */
export async function getAllPetugas(): Promise<Petugas[]> {
  const data = await apiRequest<any[]>("petugas");
  console.log(
    "🔍 RAW DATA FROM API:",
    data.filter((d) => ["Superadmin1", "Admin13"].includes(d.username))
  );
  return data.map((item) => {
    const mapped = {
      id: item.id || item.id_petugas,
      id_warga: item.id_warga, // Simpan id_warga untuk keperluan presensi
      kelompokId: item.kelompokId || item.id_kelompok_ronda, // Tambahkan kelompokId
      namaLengkap: item.namaWarga || item.nama_lengkap || "",
      nik: item.nik || "",
      namaKelompok: item.namaKelompok || "",
      jadwalHari: item.jadwalHari || "", // Tambahkan jadwalHari
      jabatan: item.jabatan || "",
      role: item.role, // HAPUS FALLBACK - gunakan langsung dari backend
      status: item.status || "Tidak Aktif",
      username: item.username || "",
      createdAt: new Date(item.created_at || new Date()),
      updatedAt: new Date(item.updated_at || new Date()),
    };
    if (["Superadmin1", "Admin13"].includes(item.username)) {
      console.log(`🔍 MAPPED ${item.username}:`, {
        original_role: item.role,
        mapped_role: mapped.role,
      });
    }
    return mapped;
  });
}

export async function createPetugas(data: any) {
  return apiRequest("petugas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePetugas(
  id: string,
  data: Partial<User>
): Promise<any> {
  console.log("🔄 updatePetugas called with:", { id, data });
  return apiRequest<any>(`petugas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePetugas(id: string): Promise<void> {
  await apiRequest(`petugas/${id}`, { method: "DELETE" });
}

export async function checkPetugasScheduleToday(idPetugas: string) {
  try {
    // Panggil API dengan id_petugas (tanpa parameter checkBy)
    const response = await apiRequest(`petugas/${idPetugas}/check-schedule`);

    console.log("INI data", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking petugas schedule:", error);
    return { hasScheduleToday: false, todayName: "" };
  }
}

/* ==================== JENIS DANA ==================== */
export async function getAllJenisDana(): Promise<JenisDana[]> {
  return apiRequest<JenisDana[]>("jenis-dana");
}

export async function createJenisDana(
  data: Omit<JenisDana, "id" | "createdAt" | "updatedAt">
): Promise<JenisDana | any> {
  return apiRequest<any>("jenis-dana", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateJenisDana(
  id: string,
  data: Partial<JenisDana>
): Promise<JenisDana | any> {
  return apiRequest<any>(`jenis-dana/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteJenisDana(id: string): Promise<void> {
  await apiRequest(`jenis-dana/${id}`, { method: "DELETE" });
}

/* ==================== KELOMPOK RONDA ==================== */
export async function getAnggotaByKelompokId(id: string) {
  return apiRequest<any>(`kelompok-ronda/${id}/anggota`);
}

export async function getAllKelompokRonda(): Promise<KelompokRonda[]> {
  return apiRequest<KelompokRonda[]>("kelompok-ronda");
}

export async function createKelompokRonda(
  data: Omit<KelompokRonda, "id" | "createdAt" | "updatedAt">
): Promise<KelompokRonda | any> {
  return apiRequest<any>("kelompok-ronda", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateKelompokRonda(
  id: string,
  data: Partial<KelompokRonda>
): Promise<KelompokRonda | any> {
  return apiRequest<any>(`kelompok-ronda/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteKelompokRonda(id: string): Promise<void> {
  await apiRequest(`kelompok-ronda/${id}`, { method: "DELETE" });
}

/* ==================== TRANSAKSI ==================== */
export async function getAllTransaksi(): Promise<Transaksi[]> {
  return apiRequest<Transaksi[]>("transaksi");
}

export async function createTransaksi(
  data: Omit<Transaksi, "id" | "createdAt" | "updatedAt">
): Promise<Transaksi | any> {
  return apiRequest<any>("transaksi", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTransaksiById(id: string): Promise<Transaksi> {
  return apiRequest<Transaksi>(`transaksi/${id}`);
}

export async function getTransaksiByWarga(
  id_warga: string
): Promise<Transaksi[]> {
  return apiRequest<Transaksi[]>(`transaksi/warga/${id_warga}`);
}

/* ==================== PRESENSI ==================== */
export async function getAllPresensi(): Promise<Presensi[]> {
  return apiRequest<Presensi[]>("presensi");
}

export async function createPresensi(data: any): Promise<Presensi | any> {
  // Helper function to convert Date to MySQL DATETIME format in Indonesia timezone
  const toMySQLDateTime = (date: Date | null | undefined): string | null => {
    if (!date) return null;

    // Pastikan date adalah Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    // Format sebagai YYYY-MM-DD HH:mm:ss menggunakan waktu lokal browser
    // Browser user di Indonesia akan otomatis menggunakan GMT+7
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Convert frontend data format to backend format
  const backendData = {
    id_warga: data.id_warga || data.id_user, // Backend expects id_warga
    tanggal: data.tanggal, // Should be in YYYY-MM-DD format
    check_in: toMySQLDateTime(data.check_in),
    check_out: toMySQLDateTime(data.check_out),
    status: data.status,
  };

  console.log("createPresensi - Input data:", data);
  console.log("createPresensi - Backend data:", backendData);

  const result = await apiRequest<any>("presensi", {
    method: "POST",
    body: JSON.stringify(backendData),
  });

  console.log("createPresensi - Result:", result);
  return result;
}

export async function updatePresensi(
  id: string,
  data: any
): Promise<Presensi | any> {
  // Helper function to convert Date to MySQL DATETIME format in Indonesia timezone
  const toMySQLDateTime = (date: Date | null | undefined): string | null => {
    if (!date) return null;

    // Pastikan date adalah Date object
    const dateObj = date instanceof Date ? date : new Date(date);

    // Format sebagai YYYY-MM-DD HH:mm:ss menggunakan waktu lokal browser
    // Browser user di Indonesia akan otomatis menggunakan GMT+7
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Convert frontend data format to backend format
  const backendData = {
    id_warga: data.id_warga || data.id_user, // Backend expects id_warga
    tanggal: data.tanggal, // Should be in YYYY-MM-DD format
    check_in: toMySQLDateTime(data.check_in),
    check_out: toMySQLDateTime(data.check_out),
    status: data.status,
  };

  return apiRequest<any>(`presensi/${id}`, {
    method: "PUT",
    body: JSON.stringify(backendData),
  });
}

export async function getTodayPresensi(): Promise<Presensi[]> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format tanggal ke YYYY-MM-DD untuk backend
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  console.log(
    `getTodayPresensi: startDate=${todayStr}, endDate=${tomorrowStr}`
  );

  return apiRequest<Presensi[]>(
    `presensi?startDate=${todayStr}&endDate=${tomorrowStr}`
  );
}

export async function getPresensiByDateRange(
  startDate: string,
  endDate: string
): Promise<Presensi[]> {
  console.log(
    `getPresensiByDateRange: startDate=${startDate}, endDate=${endDate}`
  );
  return apiRequest<Presensi[]>(
    `presensi?startDate=${startDate}&endDate=${endDate}`
  );
}

// Alias agar tetap bisa pakai nama pendek
export const getWarga = getAllWarga;
export const getJenisDana = getAllJenisDana;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

// Helper function untuk API request
async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      cache: "no-store",
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    const payload = await res.json().catch(() => null);

    if (
      payload &&
      typeof payload === "object" &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      return payload.data as T;
    }

    return payload as T;
  } catch (error) {
    console.error(`Failed to fetch ${API_BASE_URL}/${endpoint}:`, error);
    throw new Error(
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  id_warga?: string;
  id_jenis?: string;
  id_jenis_dana?: string;
  status_jimpitan?: "lunas" | "belum_lunas" | "all";
}

export interface TransactionSummary {
  totalTransaksi: number;
  totalNominal: number;
  totalHariIni: number;
  totalBulanIni: number;
  rataRataHarian: number;
}

// Get transactions with filters
export const getTransaksi = async (
  filter?: TransactionFilter
): Promise<any[]> => {
  try {
    const data = await apiRequest<any[]>("transaksi");

    let filteredTransaksi = Array.isArray(data) ? data : [];

    if (filter) {
      if (filter.startDate) {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => new Date(t.tanggal_setor) >= filter.startDate!
        );
      }
      if (filter.endDate) {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => new Date(t.tanggal_setor) <= filter.endDate!
        );
      }
      if (filter.id_warga) {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => t.id_warga == filter.id_warga
        );
      }
      if (filter.id_jenis_dana) {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => t.id_jenis_dana == filter.id_jenis_dana
        );
      }
      if (filter.id_jenis) {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => t.id_jenis_dana == filter.id_jenis
        );
      }
      if (filter.status_jimpitan && filter.status_jimpitan !== "all") {
        filteredTransaksi = filteredTransaksi.filter(
          (t) => t.status_jimpitan === filter.status_jimpitan
        );
      }
    }

    return filteredTransaksi.sort(
      (a, b) =>
        new Date(b.waktu_input).getTime() - new Date(a.waktu_input).getTime()
    );
  } catch (error) {
    console.error("Error fetching transaksi:", error);
    return [];
  }
};

// Get transaction summary
export const getTransactionSummary = async (
  filter?: TransactionFilter
): Promise<TransactionSummary> => {
  try {
    const transaksi = await getTransaksi(filter);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalTransaksi = transaksi.length;
    const totalNominal = transaksi.reduce(
      (sum, t) => sum + (parseInt(t.nominal) || 0),
      0
    );

    const transaksiHariIni = transaksi.filter((t) => {
      const tanggalSetor = new Date(t.tanggal_setor);
      return tanggalSetor.toDateString() === today.toDateString();
    });
    const totalHariIni = transaksiHariIni.reduce(
      (sum, t) => sum + (parseInt(t.nominal) || 0),
      0
    );

    const transaksiBulanIni = transaksi.filter((t) => {
      const tanggalSetor = new Date(t.tanggal_setor);
      return tanggalSetor >= startOfMonth;
    });
    const totalBulanIni = transaksiBulanIni.reduce(
      (sum, t) => sum + (parseInt(t.nominal) || 0),
      0
    );

    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const rataRataHarian = totalBulanIni / daysInMonth;

    return {
      totalTransaksi,
      totalNominal,
      totalHariIni,
      totalBulanIni,
      rataRataHarian,
    };
  } catch (error) {
    console.error("Error getting transaction summary:", error);
    return {
      totalTransaksi: 0,
      totalNominal: 0,
      totalHariIni: 0,
      totalBulanIni: 0,
      rataRataHarian: 0,
    };
  }
};

// Create new transaction
export const createTransaksi = async (data: any): Promise<any> => {
  try {
    // Transform data to match API expectations and database schema
    const apiData = {
      id_warga: data.id_warga,
      id_jenis_dana: data.id_jenis_dana || data.id_jenis, // Backend expects id_jenis_dana
      id_user: data.id_user,
      tanggal_setor: data.tanggal_setor,
      nominal: data.nominal,
      status_jimpitan: data.status_jimpitan || "lunas",
    };

    return await apiRequest("transaksi", {
      method: "POST",
      body: JSON.stringify(apiData),
    });
  } catch (error) {
    console.error("Error creating transaksi:", error);
    throw error;
  }
};

// Update transaction
export const updateTransaksi = async (id: string, data: any): Promise<any> => {
  try {
    return await apiRequest(`transaksi/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error updating transaksi:", error);
    throw error;
  }
};

// Delete transaction
export const deleteTransaksi = async (id: string): Promise<boolean> => {
  try {
    await apiRequest(`transaksi/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.error("Error deleting transaksi:", error);
    return false;
  }
};

// Get transactions by warga
export const getTransaksiByWarga = async (id_warga: string): Promise<any[]> => {
  try {
    return await apiRequest<any[]>(`transaksi/warga/${id_warga}`);
  } catch (error) {
    console.error("Error fetching transaksi by warga:", error);
    return [];
  }
};

// Get recent transactions (last 30 days)
export const getRecentTransaksi = async (): Promise<any[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filter: TransactionFilter = { startDate: thirtyDaysAgo };
  return getTransaksi(filter);
};

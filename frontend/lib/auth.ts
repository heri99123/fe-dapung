import type { User, UserRole } from "@/types/auth";
import { apiClient } from "./api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

export const authenticateUser = async (
  identifier: string,
  password: string,
  loginType: "phone" | "username"
) => {
  try {
    console.log("[AUTH] Making login request to:", `/auth/login`);
    console.log("[AUTH] API_BASE_URL from env:", API_BASE_URL);
    console.log("[AUTH] Login type:", loginType);

    // Add timeout untuk prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await apiClient
      .post<{ token: string; user: User }>(
        `/auth/login`,
        {
          identifier,
          password,
          loginType,
        },
        { signal: controller.signal }
      )
      .finally(() => clearTimeout(timeoutId));

    console.log("[AUTH] Response status:", response.success);
    console.log("[AUTH] Response data:", response);

    if (!response.success) {
      console.error("Login failed:", response.message);
      // Throw error dengan pesan dari backend
      throw new Error(response.message || "Login gagal");
    }

    if (response.success && response.data?.user) {
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(response.data.user));

      return response.data.user;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Koneksi timeout - Server tidak merespons");
      }
      // Re-throw error dengan pesan asli
      throw error;
    }
    throw new Error("Terjadi kesalahan saat login");
  }
};

export const verifyToken = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      return null;
    }

    const response = await apiClient.post(`/auth/verify-token`, {});

    const data = (await response.data) as any;

    if (!response.success) {
      // Token invalid, remove from storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      return null;
    }

    if (data.success && data.data?.user) {
      // Update user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.data.user));
      return data.data.user;
    }

    return null;
  } catch (error) {
    console.error("Token verification error:", error);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem("authToken");

    if (token) {
      await apiClient.post(`/auth/logout`, {});
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const userData = localStorage.getItem("currentUser");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getRolePermissions = (role: UserRole) => {
  const permissions = {
    warga: ["view_profile", "view_transactions"],
    petugas: [
      "scan_barcode",
      "input_transaction",
      "view_attendance",
      "mark_attendance",
    ],
    admin: [
      "manage_residents",
      "manage_officers",
      "generate_barcode",
      "view_reports",
      "manage_fund_types",
    ],
    super_admin: ["all_permissions"],
  };

  return permissions[role] || [];
};

export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  if (route.startsWith("/scan-barcode") && userRole !== "petugas") {
    return false;
  }

  const roleRoutes = {
    warga: ["/dashboard", "/profile", "/transaksi"],
    petugas: ["/dashboard", "/scan-barcode", "/input-transaksi", "/absensi"],
    admin: [
      "/dashboard",
      "/data-rumah",
      "/data-warga",
      "/data-petugas",
      "/jenis-dana",
      "/kelompok-ronda",
      "/transaksi-dana",
      "/laporan",
    ],
    super_admin: ["*"], // Akses ke semua route kecuali yang di-hard block di atas
  };

  const allowedRoutes = roleRoutes[userRole] || [];
  return (
    allowedRoutes.includes("*") ||
    allowedRoutes.some((r) => route.startsWith(r))
  );
};

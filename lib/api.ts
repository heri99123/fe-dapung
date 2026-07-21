// API client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

console.log("[v0] Using API Base URL:", API_BASE_URL);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log("[v0] Making API request:", {
        url: `${this.baseUrl}${endpoint}`,
        method: options.method || "GET",
        body: options.body,
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      console.log("[v0] Response status:", response.status);
      console.log("[v0] Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[v0] Error parsing JSON response:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      console.log("[v0] API response data:", data);

      if (!response.ok) {
        // console.error("[v0] API request failed:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   data: data,
        // });
        throw new Error(
          data.message ||
            `HTTP Error ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error("[v0] API request error:", error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Tidak dapat terhubung ke server production. Periksa koneksi internet Anda."
        );
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  }

  async post<T>(
    endpoint: string,
    body: any,
    otherHeader?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        ...otherHeader,
      },
    });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Warga API functions
export const wargaApi = {
  getAll: () => apiClient.get("/warga"),
  getById: (id: string) => apiClient.get(`/warga/${id}`),
  create: (data: any) => apiClient.post("/warga", data),
  update: (id: string, data: any) => apiClient.put(`/warga/${id}`, data),
  delete: (id: string) => apiClient.delete(`/warga/${id}`),
};

import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

// Tạo axios instance với config chung
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động thêm token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ReportMetricsDto {
  totalRevenue: number;
  totalUsers: number;
  premiumUsers: number;
  avgSessionTime: string;
  revenueGrowth: string;
  usersGrowth: string;
  premiumGrowth: string;
  sessionGrowth: string;
}

export interface RevenueDataDto {
  month: string;
  revenue: number;
  users: number;
  premium: number;
}

export interface UserGrowthDataDto {
  day: string;
  newUsers: number;
  activeUsers: number;
}

export interface SubscriptionDistributionDto {
  name: string;
  value: number;
}

export interface DetailedMetricDto {
  month: string;
  revenue: number;
  newUsers: number;
  premiumUsers: number;
  conversionRate: string;
  churnRate: string;
}

export interface ReportDashboardDto {
  metrics: ReportMetricsDto;
  revenueData: RevenueDataDto[];
  userGrowthData: UserGrowthDataDto[];
  subscriptionData: SubscriptionDistributionDto[];
  detailedMetrics: DetailedMetricDto[];
}

export const reportService = {
  // Lấy dashboard data
  async getDashboard(timeRange?: string): Promise<ReportDashboardDto> {
    const params = timeRange ? `?timeRange=${timeRange}` : "";
    const response = await apiClient.get(`/Report/dashboard${params}`);
    return response.data;
  },

  // Export report (placeholder)
  async exportReport(
    timeRange?: string,
    format: "csv" | "pdf" = "csv"
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (timeRange) params.append("timeRange", timeRange);
    params.append("format", format);

    const response = await apiClient.get(
      `/Report/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

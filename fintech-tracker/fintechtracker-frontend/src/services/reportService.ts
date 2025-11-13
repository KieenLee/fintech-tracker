import api from "./api";

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
  async getDashboard(timeRange?: string): Promise<ReportDashboardDto> {
    const response = await api.get("/Report/dashboard", { params: { timeRange } });
    return response.data;
  },

  // Export report
  async exportReport(
    timeRange?: string,
    format: "csv" | "pdf" = "csv"
  ): Promise<Blob> {
    const response = await api.get("/Report/export", {
      params: { timeRange, format },
      responseType: "blob",
    });
    return response.data;
  },
};

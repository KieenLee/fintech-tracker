import axios from "axios";
import { DashboardSummary, MonthlyTrend } from "@/types/dashboard";

const API_BASE_URL = "http://localhost:5013/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const dashboardService = {
  // FIXED: Use axios directly with correct endpoints
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get("/dashboard/summary");
    return response.data;
  },

  async getMonthlyTrend(months: number = 6): Promise<MonthlyTrend[]> {
    const response = await apiClient.get(
      `/dashboard/monthly-trend?months=${months}`
    );
    return response.data;
  },

  // Additional methods using existing endpoints
  async getDashboardOverview() {
    const response = await apiClient.get("/dashboard/overview");
    return response.data;
  },

  async getFinancialSummary() {
    const response = await apiClient.get("/dashboard/financial-summary");
    return response.data;
  },

  async getBudgetProgress() {
    const response = await apiClient.get("/dashboard/budget-progress");
    return response.data;
  },

  async getTopCategories(months: number = 1) {
    const response = await apiClient.get(
      `/dashboard/top-categories?months=${months}`
    );
    return response.data;
  },

  // BONUS: Additional dashboard methods for comprehensive data
  async getDashboardStats() {
    const response = await apiClient.get("/dashboard/stats");
    return response.data;
  },

  async getBudgetAlerts() {
    const response = await apiClient.get("/dashboard/budget-alerts");
    return response.data;
  },

  // BONUS: Method to get all dashboard data in one call
  async getAllDashboardData() {
    try {
      const [overview, summary, monthlyTrend, budgetProgress, topCategories] =
        await Promise.all([
          this.getDashboardOverview(),
          this.getDashboardSummary(),
          this.getMonthlyTrend(6),
          this.getBudgetProgress(),
          this.getTopCategories(1),
        ]);

      return {
        overview,
        summary,
        monthlyTrend,
        budgetProgress,
        topCategories,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },
};

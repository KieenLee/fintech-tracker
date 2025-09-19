import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

export interface AnalyticsOverview {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  avgMonthlyExpenses: number;
  monthlyData: MonthlyData[];
  categoryBreakdown: CategoryBreakdown[];
  netWorthTrend: NetWorthData[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface NetWorthData {
  month: string;
  netWorth: number;
}

export interface AnalyticsFilter {
  timeRange: string;
}

// Axios instance với authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyticsService = {
  getAnalyticsOverview: async (
    filter: AnalyticsFilter
  ): Promise<AnalyticsOverview> => {
    const response = await api.get("/Analytics/overview", { params: filter });
    return response.data;
  },
};

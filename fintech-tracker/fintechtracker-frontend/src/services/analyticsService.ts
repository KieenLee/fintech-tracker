import api from "./api";

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

export const analyticsService = {
  getAnalyticsOverview: async (
    filter: AnalyticsFilter
  ): Promise<AnalyticsOverview> => {
    const response = await api.get("/Analytics/overview", { params: filter });
    return response.data;
  },
};
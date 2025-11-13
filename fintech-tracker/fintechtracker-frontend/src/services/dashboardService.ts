import api from "./api";
import { DashboardSummary, MonthlyTrend } from "@/types/dashboard";

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await api.get("/dashboard/summary");
    return response.data;
  },
  async getMonthlyTrend(months: number = 6): Promise<MonthlyTrend[]> {
    const response = await api.get(`/dashboard/monthly-trend?months=${months}`);
    return response.data;
  },
  async getDashboardOverview() {
    const response = await api.get("/dashboard/overview");
    return response.data;
  },
  async getFinancialSummary() {
    const response = await api.get("/dashboard/financial-summary");
    return response.data;
  },
  async getBudgetProgress() {
    const response = await api.get("/dashboard/budget-progress");
    return response.data;
  },
  async getTopCategories(months: number = 1) {
    const response = await api.get(`/dashboard/top-categories?months=${months}`);
    return response.data;
  },
  async getDashboardStats() {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
  async getBudgetAlerts() {
    const response = await api.get("/dashboard/budget-alerts");
    return response.data;
  },
  async getAllDashboardData() {
    const [overview, summary, monthlyTrend, budgetProgress, topCategories] =
      await Promise.all([
        this.getDashboardOverview(),
        this.getDashboardSummary(),
        this.getMonthlyTrend(6),
        this.getBudgetProgress(),
        this.getTopCategories(1),
      ]);
    return { overview, summary, monthlyTrend, budgetProgress, topCategories };
  },
};
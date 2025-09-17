import axios from 'axios';
import { DashboardSummary, MonthlyTrend, DashboardStats } from '@/types/dashboard';

const API_BASE_URL = 'http://localhost:5013/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const dashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/summary`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getMonthlyTrend(): Promise<MonthlyTrend[]> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/monthly-trend`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};
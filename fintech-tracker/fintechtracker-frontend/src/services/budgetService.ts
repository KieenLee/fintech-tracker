import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

// Types
export interface Budget {
  budgetId: number;
  userId: number;
  categoryId: number;
  categoryName: string;
  amount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  notificationThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  categoryId: number;
  amount: number;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  notificationThreshold?: number;
}

export interface BudgetFilter {
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface BudgetResponse {
  budgets: Budget[];
  totalCount: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  overallProgressPercentage: number;
}

// Axios instance với authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const budgetService = {
  // Get all budgets
  getBudgets: async (filter?: BudgetFilter): Promise<BudgetResponse> => {
    const response = await api.get("/Budget", { params: filter });
    return response.data;
  },

  // Get budget by ID
  getBudgetById: async (id: number): Promise<Budget> => {
    const response = await api.get(`/Budget/${id}`);
    return response.data;
  },

  // Create budget
  createBudget: async (budget: CreateBudgetRequest): Promise<Budget> => {
    const response = await api.post("/Budget", budget);
    return response.data;
  },

  // Update budget
  updateBudget: async (
    id: number,
    budget: CreateBudgetRequest
  ): Promise<Budget> => {
    const response = await api.put(`/Budget/${id}`, budget);
    return response.data;
  },

  // Delete budget
  deleteBudget: async (id: number): Promise<void> => {
    await api.delete(`/Budget/${id}`);
  },
};

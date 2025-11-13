import api from "./api";

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

export const budgetService = {
  getBudgets: async (filter?: BudgetFilter): Promise<BudgetResponse> => {
    const response = await api.get("/Budget", { params: filter });
    return response.data;
  },
  getBudgetById: async (id: number): Promise<Budget> => {
    const response = await api.get(`/Budget/${id}`);
    return response.data;
  },
  createBudget: async (budget: CreateBudgetRequest): Promise<Budget> => {
    const response = await api.post("/Budget", budget);
    return response.data;
  },
  updateBudget: async (
    id: number,
    budget: CreateBudgetRequest
  ): Promise<Budget> => {
    const response = await api.put(`/Budget/${id}`, budget);
    return response.data;
  },
  deleteBudget: async (id: number): Promise<void> => {
    await api.delete(`/Budget/${id}`);
  },
};
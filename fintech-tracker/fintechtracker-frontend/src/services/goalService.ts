import api from "./api";

export interface Goal {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
  priority: string;
  isActive: boolean;
  createdAt?: string;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  isCompleted: boolean;
}
export interface CreateGoalRequest {
  goalName: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: string;
  description?: string;
  priority: string;
}
export interface UpdateGoalRequest {
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
  priority: string;
}
export interface AddMoneyRequest {
  amount: number;
}

export const goalService = {
  async getAllGoals(): Promise<Goal[]> {
    const response = await api.get("/Goal");
    return response.data;
  },
  async getGoal(id: number): Promise<Goal> {
    const response = await api.get(`/Goal/${id}`);
    return response.data;
  },
  async createGoal(goal: CreateGoalRequest): Promise<Goal> {
    const response = await api.post("/Goal", goal);
    return response.data;
  },
  async updateGoal(id: number, goal: UpdateGoalRequest): Promise<void> {
    await api.put(`/Goal/${id}`, goal);
  },
  async deleteGoal(id: number): Promise<void> {
    await api.delete(`/Goal/${id}`);
  },
  async addMoneyToGoal(id: number, amount: number): Promise<Goal> {
    const response = await api.post(`/Goal/${id}/add-money`, { amount });
    return response.data;
  },
};
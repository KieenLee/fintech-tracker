import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

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

class GoalService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }

  async getAllGoals(): Promise<Goal[]> {
    const response = await axios.get(
      `${API_BASE_URL}/Goal`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getGoal(id: number): Promise<Goal> {
    const response = await axios.get(
      `${API_BASE_URL}/Goal/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async createGoal(goal: CreateGoalRequest): Promise<Goal> {
    const response = await axios.post(
      `${API_BASE_URL}/Goal`,
      goal,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async updateGoal(id: number, goal: UpdateGoalRequest): Promise<void> {
    await axios.put(`${API_BASE_URL}/Goal/${id}`, goal, this.getAuthHeaders());
  }

  async deleteGoal(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/Goal/${id}`, this.getAuthHeaders());
  }

  async addMoneyToGoal(id: number, amount: number): Promise<Goal> {
    const response = await axios.post(
      `${API_BASE_URL}/Goal/${id}/add-money`,
      { amount },
      this.getAuthHeaders()
    );
    return response.data;
  }
}

export const goalService = new GoalService();

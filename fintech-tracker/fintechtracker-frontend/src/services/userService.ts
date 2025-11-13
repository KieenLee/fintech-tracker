import api from "./api";

export interface UserListDto {
  userId: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  joinDate: string;
  lastActive?: string;
  totalSpent: number;
  subscription: string;
  isActive: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  subscription: string;
  password: string;
}

export interface UpdateUserDto {
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  subscription: string;
  isActive: boolean;
}

export interface UserStatsDto {
  totalUsers: number;
  premiumUsers: number;
  totalRevenue: number;
  avgRetention: number;
  totalUsersGrowth: string;
  premiumUsersGrowth: string;
  revenueGrowth: string;
  retentionGrowth: string;
}

export interface UserDetailDto extends UserListDto {
  phone?: string;
  totalTransactions: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  users: UserListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    role?: string;
    subscription?: string;
    page?: number;
    pageSize?: number;
  }): Promise<UsersResponse> {
    const response = await api.get("/User", { params });

    return {
      users: response.data,
      totalCount: parseInt(response.headers["x-total-count"] || "0"),
      page: parseInt(response.headers["x-page"] || "1"),
      pageSize: parseInt(response.headers["x-page-size"] || "10"),
    };
  },
  async getUserStats(): Promise<UserStatsDto> {
    const response = await api.get("/User/stats");
    return response.data;
  },
  async getUser(id: number): Promise<UserDetailDto> {
    const response = await api.get(`/User/${id}`);
    return response.data;
  },
  async createUser(userData: CreateUserDto): Promise<UserDetailDto> {
    const response = await api.post("/User", userData);
    return response.data;
  },
  async updateUser(id: number, userData: UpdateUserDto): Promise<void> {
    await api.put(`/User/${id}`, userData);
  },
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/User/${id}`);
  },
};

import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

// Tạo axios instance với config chung
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động thêm token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  // Lấy danh sách users
  async getUsers(params?: {
    search?: string;
    role?: string;
    subscription?: string;
    page?: number;
    pageSize?: number;
  }): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.role) searchParams.append("role", params.role);
    if (params?.subscription)
      searchParams.append("subscription", params.subscription);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.pageSize)
      searchParams.append("pageSize", params.pageSize.toString());

    const response = await apiClient.get(`/User?${searchParams.toString()}`);

    return {
      users: response.data,
      totalCount: parseInt(response.headers["x-total-count"] || "0"),
      page: parseInt(response.headers["x-page"] || "1"),
      pageSize: parseInt(response.headers["x-page-size"] || "10"),
    };
  },

  // Lấy thống kê users
  async getUserStats(): Promise<UserStatsDto> {
    const response = await apiClient.get("/User/stats");
    return response.data;
  },

  // Lấy chi tiết 1 user
  async getUser(id: number): Promise<UserDetailDto> {
    const response = await apiClient.get(`/User/${id}`);
    return response.data;
  },

  // Tạo user mới
  async createUser(userData: CreateUserDto): Promise<UserDetailDto> {
    const response = await apiClient.post("/User", userData);
    return response.data;
  },

  // Cập nhật user
  async updateUser(id: number, userData: UpdateUserDto): Promise<void> {
    await apiClient.put(`/User/${id}`, userData);
  },

  // Xóa user
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/User/${id}`);
  },
};

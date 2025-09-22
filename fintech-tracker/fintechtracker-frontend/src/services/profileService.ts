import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

export interface ProfileResponse {
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  joinDate?: string;
  role: string;
  stats: QuickStats;
  accountLevel: AccountLevel;
  achievements: Achievement[];
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface QuickStats {
  totalTransactions: number;
  budgetsCreated: number;
  goalsAchieved: number;
  daysActive: number;
}

export interface AccountLevel {
  currentLevel: string;
  progress: number;
  nextLevel: string;
  points: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  date?: string;
  progress: number;
}

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

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get("/Profile");
    return response.data;
  },

  updateProfile: async (profileData: UpdateProfileRequest): Promise<void> => {
    await api.put("/Profile", profileData);
  },

  uploadAvatar: async (
    avatarFile: File
  ): Promise<{ avatarUrl: string; message: string }> => {
    const formData = new FormData();
    formData.append("avatarFile", avatarFile);

    const response = await api.post("/Profile/upload-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete("/Profile/avatar");
  },
};

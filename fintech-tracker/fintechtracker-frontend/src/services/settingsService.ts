import axios from "axios";

const API_BASE_URL = "http://localhost:5013/api";

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  currency: string;
  language: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
  weeklyReports: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  analyticsTracking: boolean;
  marketingEmails: boolean;
}

export interface UserSettingsResponse {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  currency: string;
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

// Axios instance với authentication
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

export const settingsService = {
  getUserSettings: async (): Promise<UserSettingsResponse> => {
    const response = await api.get("/Setting");
    return response.data;
  },

  updateProfile: async (profileData: UpdateProfileRequest): Promise<void> => {
    await api.put("/Setting/profile", profileData);
  },

  changePassword: async (
    passwordData: ChangePasswordRequest
  ): Promise<void> => {
    await api.put("/Setting/change-password", passwordData);
  },

  updateNotifications: async (
    notificationData: NotificationSettings
  ): Promise<void> => {
    await api.put("/Setting/notifications", notificationData);
  },

  updatePrivacy: async (privacyData: PrivacySettings): Promise<void> => {
    await api.put("/Setting/privacy", privacyData);
  },
};

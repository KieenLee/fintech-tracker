import api from "./api";

export interface RegisterResponse {
  message: string;
  email: string;
}
export interface VerifyOtpResponse {
  message: string;
}
export interface ResendOtpResponse {
  message: string;
  email: string;
}
export interface PendingRegistration {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export const authService = {
  login: async (credentials: {
    email?: string;
    username?: string;
    password?: string;
  }) => {
    const response = await api.post("/Auth/login", credentials);
    return response.data;
  },

  register: async (data: PendingRegistration) => {
    const response = await api.post<RegisterResponse>("/Auth/register", data);
    return response.data;
  },

  verifyOtp: async (data: { email: string; otp: string }) => {
    const response = await api.post<VerifyOtpResponse>("/Auth/verify-otp", data);
    return response.data;
  },

  resendOtp: async (data: { email: string }) => {
    const response = await api.post<ResendOtpResponse>("/Auth/resend-otp", data);
    return response.data;
  },

  checkEmail: async (email: string) => {
    await api.post("/Auth/check-email", { email });
  },
  
  checkUsername: async (username: string) => {
    await api.post("/Auth/check-username", { username });
  },

  loginWithGoogle: async (idToken: string) => {
    const response = await api.post("/Auth/google", { idToken });
    return response.data;
  },
};
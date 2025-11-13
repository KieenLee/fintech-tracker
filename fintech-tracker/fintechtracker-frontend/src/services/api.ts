import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5013";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export const userAPI = {
  login: (credentials) => api.post("/api/auth/login", credentials),
  register: (data) => api.post("/api/auth/register", data),
  getProfile: () => api.get("/api/user/profile"),
};

export const transactionAPI = {
  getAll: () => api.get("/api/transactions"),
  create: (data) => api.post("/api/transactions", data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
};
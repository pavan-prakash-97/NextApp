import axiosInstance from "./axios";
import { AxiosRequestConfig } from "axios";

// User API endpoints
export const userApi = {
  // Get current user profile
  getProfile: async () => {
    const response = await axiosInstance.get("/api/user");
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: { name?: string; image?: string }) => {
    const response = await axiosInstance.patch("/api/user", data);
    return response.data;
  },

  // Get user role
  getRole: async () => {
    const response = await axiosInstance.get("/api/user/role");
    return response.data;
  },
};

// Generic API helper
export const api = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  post: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  put: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T = unknown>(url: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },
};

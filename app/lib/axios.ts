import axios from "axios";

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
      });
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  },
  (error) => {
    const errorData = {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.error || error.message,
    };

    console.error("API Response Error:", errorData);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

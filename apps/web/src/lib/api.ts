import axios from "axios";
import { env } from "@forge/env/web";

export const api = axios.create({
  baseURL: env.VITE_SERVER_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  issues?: Array<{ field: string; message: string }>;
}

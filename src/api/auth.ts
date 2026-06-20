import { api } from './axios';
import type { ApiResponse, LoginResponse, AuthUser } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/logout', { refreshToken }),

  me: () => api.get<ApiResponse<AuthUser>>('/auth/me'),
};

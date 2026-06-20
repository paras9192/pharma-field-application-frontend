import { api } from './axios';
import type { ApiResponse, PaginatedResponse, User, CreateUserPayload, UpdateUserPayload } from '@/types/api';

export const usersApi = {
  create: (data: CreateUserPayload) =>
    api.post<ApiResponse<User>>('/users', data),

  list: (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  update: (id: string, data: UpdateUserPayload) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),

  toggleActive: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/toggle-active`),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>('/users/me/change-password', { currentPassword, newPassword }),

  resetPassword: (id: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>(`/users/${id}/reset-password`, { password }),
};

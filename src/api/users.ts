import { api } from './axios';
import type { ApiResponse, PaginatedResponse, User, SalesPersonChemist, CreateUserPayload, UpdateUserPayload, MyProfile, UpdateMePayload, ProfileDocumentType } from '@/types/api';

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

  // ── Own profile (any authenticated user) ──
  updateMe: (data: UpdateMePayload) =>
    api.patch<ApiResponse<MyProfile>>('/users/me', data),

  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<MyProfile>>('/users/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadDocument: (type: ProfileDocumentType, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ApiResponse<MyProfile>>(`/users/me/documents/${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  resetPassword: (id: string, password: string) =>
    api.post<ApiResponse<{ message: string }>>(`/users/${id}/reset-password`, { password }),

  getAssignedChemists: (salesPersonId: string) =>
    api.get<ApiResponse<SalesPersonChemist[]>>(`/users/${salesPersonId}/assigned-chemists`),

  assignChemists: (salesPersonId: string, chemistIds: string[]) =>
    api.post<ApiResponse<{ message: string }>>(`/users/${salesPersonId}/assigned-chemists`, { chemistIds }),

  removeAssignedChemist: (salesPersonId: string, chemistId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/users/${salesPersonId}/assigned-chemists/${chemistId}`),

  sendResetLink: (id: string) =>
    api.post<ApiResponse<{ message: string }>>(`/users/${id}/send-reset-link`),
};

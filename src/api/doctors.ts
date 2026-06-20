import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Doctor, CreateDoctorPayload } from '@/types/api';

export const doctorsApi = {
  create: (data: CreateDoctorPayload) =>
    api.post<ApiResponse<Doctor>>('/doctors', data),

  list: (params?: { search?: string; territoryId?: number; isActive?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Doctor>>('/doctors', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Doctor>>(`/doctors/${id}`),

  update: (id: string, data: Partial<CreateDoctorPayload>) =>
    api.patch<ApiResponse<Doctor>>(`/doctors/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<Doctor>>(`/doctors/${id}`),
};

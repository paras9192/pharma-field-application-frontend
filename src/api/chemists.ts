import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Chemist, CreateChemistPayload } from '@/types/api';

export const chemistsApi = {
  create: (data: CreateChemistPayload) =>
    api.post<ApiResponse<Chemist>>('/chemists', data),

  list: (params?: { search?: string; territoryId?: number; isActive?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Chemist>>('/chemists', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Chemist>>(`/chemists/${id}`),

  update: (id: string, data: Partial<CreateChemistPayload>) =>
    api.patch<ApiResponse<Chemist>>(`/chemists/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<Chemist>>(`/chemists/${id}`),

  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post<ApiResponse<Chemist>>(`/chemists/${id}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage: (id: string, imageId: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/chemists/${id}/images/${imageId}`),
};

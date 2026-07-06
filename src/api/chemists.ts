import { api, UPLOAD_TIMEOUT } from './axios';
import { compressImages } from '@/lib/compressImage';
import { uploadFilesToS3 } from './uploads';
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

  uploadImages: async (id: string, files: File[]) => {
    const compressed = await compressImages(files);
    const uploaded = await uploadFilesToS3('chemists', compressed);
    return api.post<ApiResponse<Chemist>>(`/chemists/${id}/images`, { files: uploaded }, {
      timeout: UPLOAD_TIMEOUT,
    });
  },

  deleteImage: (id: string, imageId: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/chemists/${id}/images/${imageId}`),

  sendReminder: (id: string) =>
    api.post<ApiResponse<{ message: string; billCount: number }>>(`/chemists/${id}/payment-reminder`),
};

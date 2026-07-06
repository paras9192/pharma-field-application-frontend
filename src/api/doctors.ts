import { api, UPLOAD_TIMEOUT } from './axios';
import { compressImages } from '@/lib/compressImage';
import { uploadFilesToS3 } from './uploads';
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

  uploadImages: async (id: string, files: File[]) => {
    const compressed = await compressImages(files);
    const uploaded = await uploadFilesToS3('doctors', compressed);
    return api.post<ApiResponse<Doctor>>(`/doctors/${id}/images`, { files: uploaded }, {
      timeout: UPLOAD_TIMEOUT,
    });
  },

  deleteImage: (id: string, imageId: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/doctors/${id}/images/${imageId}`),
};

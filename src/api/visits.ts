import { api, UPLOAD_TIMEOUT } from './axios';
import { compressImages } from '@/lib/compressImage';
import { uploadFilesToS3 } from './uploads';
import type { ApiResponse, PaginatedResponse, Visit, CreateVisitPayload, VisitStatus } from '@/types/api';

export const visitsApi = {
  create: (data: CreateVisitPayload) =>
    api.post<ApiResponse<Visit>>('/visits', data),

  list: (params?: {
    userId?: string;
    visitType?: string;
    from?: string;
    to?: string;
    territoryId?: number;
    followUpPending?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<PaginatedResponse<Visit>>('/visits', { params }),

  pendingFollowUps: () =>
    api.get<ApiResponse<Visit[]>>('/visits/follow-ups/pending'),

  get: (id: string) =>
    api.get<ApiResponse<Visit>>(`/visits/${id}`),

  update: (id: string, data: Partial<CreateVisitPayload> & { followUpDone?: boolean; status?: VisitStatus }) =>
    api.patch<ApiResponse<Visit>>(`/visits/${id}`, data),

  markFollowUpDone: (id: string) =>
    api.patch<ApiResponse<Visit>>(`/visits/${id}/follow-up-done`),

  uploadImages: async (id: string, files: File[]) => {
    const compressed = await compressImages(files);
    const uploaded = await uploadFilesToS3('visits', compressed);
    return api.post<ApiResponse<Visit>>(`/visits/${id}/images`, { files: uploaded }, {
      timeout: UPLOAD_TIMEOUT,
    });
  },

  deleteImage: (id: string, imageId: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/visits/${id}/images/${imageId}`),
};

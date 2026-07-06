import { api, UPLOAD_TIMEOUT } from './axios';
import { compressImages } from '@/lib/compressImage';
import { uploadFilesToS3 } from './uploads';
import type { ApiResponse, PaginatedResponse, Bill, BillStatus, Settlement, SettlementType } from '@/types/api';

export const billsApi = {
  create: (data: {
    chemistId: string;
    orderId?: string;
    originalBillId?: string;
    totalAmount: number;
    dueDate?: string;
    notes?: string;
  }) => api.post<ApiResponse<Bill>>('/bills', data),

  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    chemistId?: string;
    status?: BillStatus;
    from?: string;
    to?: string;
  }) => api.get<PaginatedResponse<Bill>>('/bills', { params }),

  get: (id: string) => api.get<ApiResponse<Bill>>(`/bills/${id}`),

  uploadImages: async (id: string, files: File[]) => {
    const compressed = await compressImages(files);
    const uploaded = await uploadFilesToS3('bills', compressed);
    return api.post<ApiResponse<Bill>>(`/bills/${id}/upload`, { files: uploaded }, {
      timeout: UPLOAD_TIMEOUT,
    });
  },

  deleteImage: (billId: string, imageId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/bills/${billId}/images/${imageId}`),

  createSettlement: (data: {
    billId: string;
    type: SettlementType;
    amount: number;
    notes?: string;
  }) => api.post<ApiResponse<Settlement>>('/bills/settlements', data),

  getSettlements: (id: string) =>
    api.get<ApiResponse<Settlement[]>>(`/bills/${id}/settlements`),
};

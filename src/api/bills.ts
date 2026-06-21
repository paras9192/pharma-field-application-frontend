import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Bill, BillStatus, Settlement, SettlementType } from '@/types/api';

export const billsApi = {
  create: (data: {
    chemistId: string;
    orderId?: string;
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

  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return api.post<ApiResponse<Bill>>(`/bills/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Payment, PaymentMode, PaymentSummary } from '@/types/api';

export const paymentsApi = {
  collect: (data: {
    billId: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    notes?: string;
  }) => api.post<ApiResponse<Payment>>('/payments', data),

  list: (params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    billId?: string;
  }) => api.get<PaginatedResponse<Payment>>('/payments', { params }),

  summary: (params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<PaymentSummary>>('/payments/summary', { params }),

  get: (id: string) => api.get<ApiResponse<Payment>>(`/payments/${id}`),
};

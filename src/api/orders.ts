import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Order, OrderStatus } from '@/types/api';

export const ordersApi = {
  create: (data: {
    chemistId: string;
    expectedDelivery?: string;
    notes?: string;
    items: { productName: string; quantity: number; rate: number; notes?: string }[];
  }) => api.post<ApiResponse<Order>>('/orders', data),

  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    chemistId?: string;
    status?: OrderStatus;
    from?: string;
    to?: string;
  }) => api.get<PaginatedResponse<Order>>('/orders', { params }),

  get: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus, notes?: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status, notes }),
};

import { api } from './axios';
import type { ApiResponse, NotificationsResponse } from '@/types/api';

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<NotificationsResponse>>('/notifications', { params }),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  saveFcmToken: (token: string, deviceInfo?: string) =>
    api.post('/notifications/fcm-token', { token, deviceInfo }),

  removeFcmToken: (token: string) =>
    api.delete('/notifications/fcm-token', { data: { token } }),
};

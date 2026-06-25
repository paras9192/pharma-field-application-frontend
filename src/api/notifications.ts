import { api } from './axios';
import type { NotificationsResponse } from '@/types/api';

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<NotificationsResponse>('/notifications', { params }),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  saveFcmToken: (token: string) =>
    api.post('/notifications/fcm-token', { token }),

  removeFcmToken: (token: string) =>
    api.delete('/notifications/fcm-token', { data: { token } }),
};

import { api } from './axios';
import type { ApiResponse, PaginatedResponse, Attendance, CheckInPayload, CheckOutPayload } from '@/types/api';

export const attendanceApi = {
  checkIn: (data: CheckInPayload) =>
    api.post<ApiResponse<Attendance>>('/attendance/check-in', data),

  checkOut: (data: CheckOutPayload) =>
    api.post<ApiResponse<Attendance>>('/attendance/check-out', data),

  today: () =>
    api.get<ApiResponse<Attendance | null>>('/attendance/today'),

  my: (params?: { from?: string; to?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Attendance>>('/attendance/my', { params }),

  dailyPresent: (date?: string) =>
    api.get<ApiResponse<Attendance[]>>('/attendance/daily-present', { params: { date } }),

  list: (params?: { userId?: string; date?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Attendance>>('/attendance/list', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Attendance>>(`/attendance/${id}`),
};

import { api } from './axios';
import type { ApiResponse, PaginatedResponse, DailyReport, CreateDailyReportPayload, ReportStatus } from '@/types/api';

export const dailyReportsApi = {
  create: (data: CreateDailyReportPayload) =>
    api.post<ApiResponse<DailyReport>>('/daily-reports', data),

  list: (params?: { userId?: string; from?: string; to?: string; status?: ReportStatus; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<DailyReport>>('/daily-reports', { params }),

  today: () =>
    api.get<ApiResponse<DailyReport | null>>('/daily-reports/today'),

  get: (id: string) =>
    api.get<ApiResponse<DailyReport>>(`/daily-reports/${id}`),

  update: (id: string, data: Partial<CreateDailyReportPayload>) =>
    api.patch<ApiResponse<DailyReport>>(`/daily-reports/${id}`, data),

  submit: (id: string) =>
    api.patch<ApiResponse<DailyReport>>(`/daily-reports/${id}/submit`),
};

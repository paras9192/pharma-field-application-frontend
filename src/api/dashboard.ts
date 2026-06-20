import { api } from './axios';
import type { ApiResponse, AdminDashboard, EmployeeDashboard, TerritoryStats, EmployeePerformance } from '@/types/api';

export const dashboardApi = {
  admin: (date?: string) =>
    api.get<ApiResponse<AdminDashboard>>('/dashboard/admin', { params: { date } }),

  me: (date?: string) =>
    api.get<ApiResponse<EmployeeDashboard>>('/dashboard/me', { params: { date } }),

  territories: () =>
    api.get<ApiResponse<TerritoryStats[]>>('/dashboard/territories'),

  performance: (from?: string, to?: string) =>
    api.get<ApiResponse<EmployeePerformance[]>>('/dashboard/performance', { params: { from, to } }),
};

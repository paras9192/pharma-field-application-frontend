import { api } from './axios';
import type {
  ApiResponse, AdminDashboard, EmployeeDashboard, TerritoryStats, EmployeePerformance,
  SuperAdminDashboard, PaymentsDashboard, SalesPersonDashboard, MRDashboard, AlertsResponse,
} from '@/types/api';

export const dashboardApi = {
  admin: (date?: string) =>
    api.get<ApiResponse<AdminDashboard>>('/dashboard/admin', { params: { date } }),

  me: (date?: string) =>
    api.get<ApiResponse<EmployeeDashboard>>('/dashboard/me', { params: { date } }),

  territories: () =>
    api.get<ApiResponse<TerritoryStats[]>>('/dashboard/territories'),

  performance: (from?: string, to?: string) =>
    api.get<ApiResponse<EmployeePerformance[]>>('/dashboard/performance', { params: { from, to } }),

  superAdmin: (date?: string) =>
    api.get<ApiResponse<SuperAdminDashboard>>('/dashboard/super-admin', { params: { date } }),

  payments: (from?: string, to?: string) =>
    api.get<ApiResponse<PaymentsDashboard>>('/dashboard/payments', { params: { from, to } }),

  salesPerson: (params?: { userId?: string; date?: string }) =>
    api.get<ApiResponse<SalesPersonDashboard>>('/dashboard/sales-person', { params }),

  mr: (params?: { userId?: string; date?: string }) =>
    api.get<ApiResponse<MRDashboard>>('/dashboard/mr', { params }),

  alerts: () =>
    api.get<ApiResponse<AlertsResponse>>('/dashboard/alerts'),
};

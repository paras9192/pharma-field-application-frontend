import { api } from './axios';
import type { ApiResponse, PaginatedResponse, State, District, City, Territory, TerritoryHierarchy } from '@/types/api';

export const territoriesApi = {
  getHierarchy: () =>
    api.get<ApiResponse<TerritoryHierarchy[]>>('/territories/hierarchy'),

  createState: (data: { name: string; code: string }) =>
    api.post<ApiResponse<State>>('/territories/states', data),

  getStates: () =>
    api.get<ApiResponse<State[]>>('/territories/states'),

  getState: (id: number) =>
    api.get<ApiResponse<State>>(`/territories/states/${id}`),

  createDistrict: (data: { name: string; stateId: number }) =>
    api.post<ApiResponse<District>>('/territories/districts', data),

  getDistricts: (stateId?: number) =>
    api.get<ApiResponse<District[]>>('/territories/districts', { params: { stateId } }),

  getDistrict: (id: number) =>
    api.get<ApiResponse<District>>(`/territories/districts/${id}`),

  createCity: (data: { name: string; districtId: number }) =>
    api.post<ApiResponse<City>>('/territories/cities', data),

  getCities: (districtId?: number) =>
    api.get<ApiResponse<City[]>>('/territories/cities', { params: { districtId } }),

  create: (data: { name: string; cityId: number; code?: string; description?: string }) =>
    api.post<ApiResponse<Territory>>('/territories', data),

  list: (params?: { search?: string; cityId?: number; isActive?: string }) =>
    api.get<PaginatedResponse<Territory>>('/territories', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Territory>>(`/territories/${id}`),

  update: (id: number, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.patch<ApiResponse<Territory>>(`/territories/${id}`, data),

  assign: (userId: string, territoryId: number) =>
    api.post<ApiResponse<unknown>>('/territories/assign', { userId, territoryId }),

  unassign: (userId: string, territoryId: number) =>
    api.delete<ApiResponse<unknown>>(`/territories/assign/${userId}/${territoryId}`),

  getUserTerritories: (userId: string) =>
    api.get<ApiResponse<Territory[]>>(`/territories/user/${userId}`),
};

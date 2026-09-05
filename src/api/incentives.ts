import { api } from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  IncentiveWallet,
  IncentiveTransaction,
  IncentivePayout,
  CreatePayoutPayload,
  WalletSummary,
  Role,
} from '@/types/api';

type ListParams = { page?: number; limit?: number };
type TransactionListParams = ListParams & { year?: number; month?: number };

export const incentivesApi = {
  getAllWallets: (params?: ListParams & { search?: string; role?: Role }) =>
    api.get<PaginatedResponse<WalletSummary>>('/incentives/wallets', { params }),

  getMyWallet: () =>
    api.get<ApiResponse<IncentiveWallet>>('/incentives/wallet/me'),

  getWallet: (userId: string) =>
    api.get<ApiResponse<IncentiveWallet>>(`/incentives/wallet/${userId}`),

  getMyTransactions: (params?: TransactionListParams) =>
    api.get<PaginatedResponse<IncentiveTransaction>>('/incentives/wallet/me/transactions', { params }),

  getTransactions: (userId: string, params?: TransactionListParams) =>
    api.get<PaginatedResponse<IncentiveTransaction>>(`/incentives/wallet/${userId}/transactions`, { params }),

  getMyPayouts: (params?: ListParams) =>
    api.get<PaginatedResponse<IncentivePayout>>('/incentives/wallet/me/payouts', { params }),

  getPayouts: (userId: string, params?: ListParams) =>
    api.get<PaginatedResponse<IncentivePayout>>(`/incentives/wallet/${userId}/payouts`, { params }),

  createPayout: (userId: string, data: CreatePayoutPayload) =>
    api.post<ApiResponse<IncentivePayout>>(`/incentives/wallet/${userId}/payouts`, data),
};

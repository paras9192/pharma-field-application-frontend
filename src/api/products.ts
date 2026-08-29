import { api, UPLOAD_TIMEOUT } from './axios';
import { compressImages } from '@/lib/compressImage';
import { uploadFilesToS3 } from './uploads';
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductListParams,
} from '@/types/api';

export const productsApi = {
  create: (data: CreateProductPayload) =>
    api.post<ApiResponse<Product>>('/products', data),

  list: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  update: (id: string, data: UpdateProductPayload) =>
    api.patch<ApiResponse<Product>>(`/products/${id}`, data),

  /** Apply a signed delta to inventory. Use this instead of `update` for stock moves. */
  adjustInventory: (id: string, delta: number, reason?: string) =>
    api.patch<ApiResponse<Product>>(`/products/${id}/inventory`, { delta, reason }),

  /** Soft delete — sets `isActive = false`. Restore with `update(id, { isActive: true })`. */
  deactivate: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/products/${id}`),

  uploadImages: async (id: string, files: File[]) => {
    const compressed = await compressImages(files);
    const uploaded = await uploadFilesToS3('products', compressed);
    return api.post<ApiResponse<Product>>(`/products/${id}/images`, { files: uploaded }, {
      timeout: UPLOAD_TIMEOUT,
    });
  },

  deleteImage: (id: string, imageId: number) =>
    api.delete<ApiResponse<{ message: string }>>(`/products/${id}/images/${imageId}`),
};

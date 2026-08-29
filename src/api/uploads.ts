import axios from 'axios';
import { api, UPLOAD_TIMEOUT } from './axios';
import type { ApiResponse } from '@/types/api';

export type UploadPurpose =
  | 'visits' | 'bills' | 'payments' | 'doctors' | 'chemists' | 'products'
  | 'profile-photos' | 'employee-documents';

interface PresignResponse {
  expiresIn: number;
  files: { key: string; url: string }[];
}

export interface UploadedRef {
  key: string;
  filename: string;
}

/**
 * Uploads files straight to S3 via presigned URLs and returns the keys to
 * pass to the module's confirm endpoint. Call AFTER compression — the size
 * and contentType sent to presign are signed into the URL, so they must
 * match the actual bytes PUT to S3.
 */
export async function uploadFilesToS3(purpose: UploadPurpose, files: File[]): Promise<UploadedRef[]> {
  const { data } = await api.post<ApiResponse<PresignResponse>>('/uploads/presign', {
    purpose,
    files: files.map(f => ({
      filename: f.name,
      contentType: f.type || 'application/octet-stream',
      size: f.size,
    })),
  });
  const presigned = data.data.files;

  // Bare axios, NOT the `api` instance: the Authorization interceptor header
  // would clash with the URL's query-string signature and S3 rejects the PUT.
  await Promise.all(
    presigned.map((p, i) =>
      axios.put(p.url, files[i], {
        headers: { 'Content-Type': files[i].type || 'application/octet-stream' },
        timeout: UPLOAD_TIMEOUT,
      }),
    ),
  );

  return presigned.map((p, i) => ({ key: p.key, filename: files[i].name }));
}

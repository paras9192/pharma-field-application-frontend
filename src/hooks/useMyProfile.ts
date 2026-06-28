import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth';

export const ME_QUERY_KEY = ['me'] as const;

/**
 * Own profile (GET /auth/me) — the richer shape with the new personal/KYC
 * fields plus `profileComplete` / `missingProfileFields`. Shared by the
 * Settings page and the global completion banner via the React Query cache.
 */
export function useMyProfile() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => (await authApi.me()).data.data,
    staleTime: 5 * 60_000,
  });
}

/** Friendly labels for the keys returned in `missingProfileFields`. */
export const PROFILE_FIELD_LABELS: Record<string, string> = {
  profilePhoto: 'Profile photo',
  dateOfBirth: 'Date of birth',
  gender: 'Gender',
  bloodGroup: 'Blood group',
  address: 'Address',
  emergencyContactName: 'Emergency contact name',
  emergencyContactPhone: 'Emergency contact phone',
  aadhaarUrl: 'Aadhaar document',
  panUrl: 'PAN document',
  tenthMarksheetUrl: '10th marksheet',
};

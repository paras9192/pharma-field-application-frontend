import type { Role } from '@/types/api';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'indigo';

/** Highest rank first — the order roles are listed in dropdowns and filters. */
export const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'ZSM', 'ASM', 'MR', 'SALES_PERSON'];

/** Long form, for dropdown options where the acronym alone is ambiguous. */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ZSM: 'Zonal Sales Manager (ZSM)',
  ASM: 'Area Sales Manager (ASM)',
  MR: 'Medical Representative (MR)',
  SALES_PERSON: 'Sales Person',
};

/** Short form, for badges and dense lists. */
export const ROLE_SHORT_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ZSM: 'ZSM',
  ASM: 'ASM',
  MR: 'MR',
  SALES_PERSON: 'Sales Person',
};

export const ROLE_BADGE_VARIANTS: Record<Role, BadgeVariant> = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'info',
  ZSM: 'indigo',
  ASM: 'teal',
  MR: 'success',
  SALES_PERSON: 'warning',
};

export const ROLE_OPTIONS = ROLES.map(r => ({ value: r, label: ROLE_LABELS[r] }));

export const ROLE_FILTER_OPTIONS = ROLES.map(r => ({ value: r, label: ROLE_SHORT_LABELS[r] }));

/**
 * ASM and ZSM are field users: they log their own visits, orders and attendance
 * exactly like an MR. Rank is currently a label only — the reporting line that
 * once gave them downward visibility was removed to stabilise the product for
 * production, so no role sees another user's records.
 */
export function isFieldRole(role: Role | undefined): boolean {
  return role === 'MR' || role === 'SALES_PERSON' || role === 'ASM' || role === 'ZSM';
}

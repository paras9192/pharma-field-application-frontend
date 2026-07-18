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
 * ASM and ZSM are field users who happen to have people under them: they log
 * their own visits, orders and attendance exactly like an MR. Rank only adds
 * downward visibility, so this must stay true for them.
 */
export function isFieldRole(role: Role | undefined): boolean {
  return role === 'MR' || role === 'SALES_PERSON' || role === 'ASM' || role === 'ZSM';
}

/** Roles that can have direct reports, and so can reach GET /users/me/team. */
export function isManagerRole(role: Role | undefined): boolean {
  return role === 'ASM' || role === 'ZSM';
}

/**
 * Which roles may be a manager for `role`, mirroring the backend's validation so
 * the form doesn't offer choices that would 400. The chain is
 * MR / Sales Person → ASM → ZSM; ZSM and the admin roles sit at the top and
 * cannot have a manager at all.
 */
export function managerRolesFor(role: Role): Role[] {
  switch (role) {
    case 'MR':
    case 'SALES_PERSON':
      return ['ZSM', 'ASM'];
    case 'ASM':
      return ['ZSM'];
    default:
      return [];
  }
}

export function canHaveManager(role: Role): boolean {
  return managerRolesFor(role).length > 0;
}

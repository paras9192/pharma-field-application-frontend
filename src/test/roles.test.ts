import { describe, it, expect } from 'vitest';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  ROLE_BADGE_VARIANTS,
  isFieldRole,
} from '@/utils/roles';
import type { Role } from '@/types/api';

describe('role metadata', () => {
  it.each(ROLES)('%s has a label, short label and badge variant', (role) => {
    expect(ROLE_LABELS[role]).toBeTruthy();
    expect(ROLE_SHORT_LABELS[role]).toBeTruthy();
    expect(ROLE_BADGE_VARIANTS[role]).toBeTruthy();
  });

  it('gives every role a visually distinct badge', () => {
    const variants = ROLES.map(r => ROLE_BADGE_VARIANTS[r]);
    expect(new Set(variants).size).toBe(ROLES.length);
  });
});

describe('isFieldRole', () => {
  // ASM/ZSM log their own visits, orders and attendance exactly like an MR.
  it.each(['MR', 'SALES_PERSON', 'ASM', 'ZSM'] as Role[])('%s is a field role', (role) => {
    expect(isFieldRole(role)).toBe(true);
  });

  it.each(['SUPER_ADMIN', 'ADMIN'] as Role[])('%s is not a field role', (role) => {
    expect(isFieldRole(role)).toBe(false);
  });

  it('handles an unknown role', () => {
    expect(isFieldRole(undefined)).toBe(false);
  });
});

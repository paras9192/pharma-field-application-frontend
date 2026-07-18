import { describe, it, expect } from 'vitest';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  ROLE_BADGE_VARIANTS,
  isFieldRole,
  isManagerRole,
  managerRolesFor,
  canHaveManager,
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

describe('isManagerRole', () => {
  it.each(['ASM', 'ZSM'] as Role[])('%s can have direct reports', (role) => {
    expect(isManagerRole(role)).toBe(true);
  });

  it.each(['SUPER_ADMIN', 'ADMIN', 'MR', 'SALES_PERSON'] as Role[])('%s cannot', (role) => {
    expect(isManagerRole(role)).toBe(false);
  });
});

// These mirror the backend's validation exactly. If they drift, the user form
// starts offering pairings that 400.
describe('managerRolesFor', () => {
  it.each(['MR', 'SALES_PERSON'] as Role[])('%s may report to an ASM or a ZSM', (role) => {
    expect(managerRolesFor(role).sort()).toEqual(['ASM', 'ZSM']);
  });

  it('ASM may report only to a ZSM', () => {
    expect(managerRolesFor('ASM')).toEqual(['ZSM']);
  });

  it.each(['ZSM', 'ADMIN', 'SUPER_ADMIN'] as Role[])('%s cannot have a manager at all', (role) => {
    expect(managerRolesFor(role)).toEqual([]);
    expect(canHaveManager(role)).toBe(false);
  });

  it('never lets a role report to itself', () => {
    for (const role of ROLES) {
      expect(managerRolesFor(role)).not.toContain(role);
    }
  });

  it('only ever nominates manager roles as managers', () => {
    for (const role of ROLES) {
      for (const manager of managerRolesFor(role)) {
        expect(isManagerRole(manager)).toBe(true);
      }
    }
  });
});

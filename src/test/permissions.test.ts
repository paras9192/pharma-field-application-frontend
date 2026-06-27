import { describe, it, expect } from 'vitest';
import {
  canEditOwnedRecord,
  canEditVisit,
  canCreateBill,
  canUploadBillImage,
  canDeleteBillImage,
} from '@/utils/permissions';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
const FIELD_ROLES = ['MR', 'ASM', 'ZSM', 'SALES_PERSON'] as const;

describe('canEditOwnedRecord', () => {
  it('allows SUPER_ADMIN to edit any record', () => {
    expect(canEditOwnedRecord('user-1', 'user-2', 'SUPER_ADMIN')).toBe(true);
    expect(canEditOwnedRecord('user-1', null, 'SUPER_ADMIN')).toBe(true);
    expect(canEditOwnedRecord('user-1', undefined, 'SUPER_ADMIN')).toBe(true);
  });

  it('allows ADMIN to edit any record', () => {
    expect(canEditOwnedRecord('user-1', 'user-2', 'ADMIN')).toBe(true);
    expect(canEditOwnedRecord('user-1', null, 'ADMIN')).toBe(true);
  });

  it.each(FIELD_ROLES)('%s can edit their own records', (role) => {
    expect(canEditOwnedRecord('user-1', 'user-1', role)).toBe(true);
  });

  it.each(FIELD_ROLES)('%s cannot edit another user\'s record', (role) => {
    expect(canEditOwnedRecord('user-1', 'user-2', role)).toBe(false);
  });

  it.each(FIELD_ROLES)('%s cannot edit a record with no owner', (role) => {
    expect(canEditOwnedRecord('user-1', null, role)).toBe(false);
    expect(canEditOwnedRecord('user-1', undefined, role)).toBe(false);
  });
});

describe('canEditVisit', () => {
  it.each(ADMIN_ROLES)('%s can edit any visit', (role) => {
    expect(canEditVisit('user-1', 'user-2', role)).toBe(true);
  });

  it.each(FIELD_ROLES)('%s can edit their own visit', (role) => {
    expect(canEditVisit('user-1', 'user-1', role)).toBe(true);
  });

  it.each(FIELD_ROLES)('%s cannot edit another user\'s visit', (role) => {
    expect(canEditVisit('user-1', 'user-2', role)).toBe(false);
  });
});

describe('canCreateBill', () => {
  it.each(ADMIN_ROLES)('%s can create bills', (role) => {
    expect(canCreateBill(role)).toBe(true);
  });

  it.each(FIELD_ROLES)('%s cannot create bills', (role) => {
    expect(canCreateBill(role)).toBe(false);
  });
});

describe('canUploadBillImage / canDeleteBillImage', () => {
  const ALL_ROLES = [...ADMIN_ROLES, ...FIELD_ROLES];

  it.each(ALL_ROLES)('%s can upload bill images', (role) => {
    expect(canUploadBillImage(role)).toBe(true);
  });

  it.each(ALL_ROLES)('%s can delete bill images', (role) => {
    expect(canDeleteBillImage(role)).toBe(true);
  });
});

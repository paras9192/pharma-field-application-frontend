import type { Role } from '@/types/api';

export function canEditOwnedRecord(
  currentUserId: string,
  addedById: string | null | undefined,
  currentRole: Role,
): boolean {
  if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') return true;
  if (!addedById) return false;
  return addedById === currentUserId;
}

export function canEditVisit(
  currentUserId: string,
  visitUserId: string,
  currentRole: Role,
): boolean {
  if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') return true;
  return visitUserId === currentUserId;
}

export function canCreateBill(role: Role): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

export function canUploadBillImage(_role: Role): boolean {
  return true;
}

export function canDeleteBillImage(_role: Role): boolean {
  return true;
}

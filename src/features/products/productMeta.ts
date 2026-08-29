import type { DosageForm, DrugSchedule } from '@/types/api';

export const DOSAGE_FORMS: DosageForm[] = [
  'TABLET', 'CAPSULE', 'SYRUP', 'SUSPENSION', 'INJECTION', 'OINTMENT',
  'CREAM', 'GEL', 'DROPS', 'POWDER', 'SACHET', 'INHALER', 'SPRAY', 'OTHER',
];

export const DRUG_SCHEDULES: DrugSchedule[] = [
  'OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'OTHER',
];

const titleCase = (s: string) =>
  s.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');

export const dosageFormLabel = (v: DosageForm | null | undefined) =>
  v ? titleCase(v) : '—';

export const drugScheduleLabel = (v: DrugSchedule | null | undefined) => {
  if (!v) return '—';
  return v === 'OTC' ? 'OTC' : titleCase(v);
};

export const dosageFormOptions = DOSAGE_FORMS.map(v => ({ value: v, label: titleCase(v) }));
export const drugScheduleOptions = DRUG_SCHEDULES.map(v => ({
  value: v,
  label: v === 'OTC' ? 'OTC' : titleCase(v),
}));

/** Money fields come back as Decimal strings — parse for display / math. */
export const money = (v: string | null | undefined) =>
  v == null || v === '' ? null : Number(v);

export const formatMoney = (v: string | null | undefined) => {
  const n = money(v);
  return n == null ? '—' : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const isLowStock = (inventory: number, reorderLevel: number | null) =>
  reorderLevel != null && inventory <= reorderLevel;

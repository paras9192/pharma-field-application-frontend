import type { Chemist } from '@/types/api';

/** Best available phone for an imported chemist (API phone first, then Marg). */
export function chemistPhone(c: Chemist): string | null {
  return c.phone || c.margMobile || c.margPhone1 || null;
}

/** Best available "where" label — territory, then Marg city / area. */
export function chemistLocality(c: Chemist): string | null {
  return c.territory?.name || c.margCity || c.margArea || null;
}

/** Secondary line under the shop name: owner if known, else an address snippet. */
export function chemistSubtitle(c: Chemist): string | null {
  if (c.ownerName) return c.ownerName;
  const addr = c.address || [c.margAddress1, c.margAddress2, c.margAddress3].filter(Boolean).join(', ');
  return addr || null;
}

/** Full address — the editable column first, then the Marg address lines. */
export function chemistAddress(c: Chemist): string | null {
  if (c.address) return c.address;
  const parts = [c.margAddress1, c.margAddress2, c.margAddress3].filter(v => isMeaningfulMarg(v));
  return parts.length ? parts.join(', ') : null;
}

/**
 * Single-line label for a chemist in a picker (native <option>): shop name,
 * then Marg code and an address / place hint so users can tell near-identical
 * shop names apart.
 */
export function chemistOptionLabel(c: Chemist): string {
  const where = chemistAddress(c) || chemistLocality(c);
  return [c.shopName, c.margCode, where].filter(Boolean).join(' · ');
}

/** Marg fields worth showing on the detail page, in display order, with labels. */
export const MARG_FIELD_LABELS: { key: keyof Chemist; label: string }[] = [
  { key: 'margCode', label: 'Marg Code' },
  { key: 'margLedger', label: 'Ledger' },
  { key: 'margGroup', label: 'Group' },
  { key: 'margType', label: 'Type' },
  { key: 'margArea', label: 'Area' },
  { key: 'margCity', label: 'City' },
  { key: 'margPin', label: 'PIN' },
  { key: 'margAddress1', label: 'Address 1' },
  { key: 'margAddress2', label: 'Address 2' },
  { key: 'margAddress3', label: 'Address 3' },
  { key: 'margContact', label: 'Contact' },
  { key: 'margMobile', label: 'Mobile' },
  { key: 'margPhone1', label: 'Phone' },
  { key: 'margResi', label: 'Residence' },
  { key: 'margLicence', label: 'Drug Licence' },
  { key: 'margTin', label: 'TIN' },
  { key: 'margStno', label: 'GST / State No.' },
  { key: 'margPanno', label: 'PAN' },
  { key: 'margMr', label: 'MR' },
  { key: 'margRout', label: 'Route' },
  { key: 'margCrdays', label: 'Credit Days' },
  { key: 'margCramount', label: 'Credit Amount' },
  { key: 'margLimitbill', label: 'Bill Limit' },
  { key: 'margLimitday', label: 'Day Limit' },
  { key: 'margLimittype', label: 'Limit Type' },
  { key: 'margFreez', label: 'Freeze' },
];

const JUNK = new Set(['', '*', '-', '- -', '-   -', '0', 'mr.', 'only indicate']);

/** True when a raw Marg value carries no real information. */
export function isMeaningfulMarg(value: string | null | undefined): value is string {
  if (!value) return false;
  return !JUNK.has(value.trim().toLowerCase());
}

export function hasMargData(c: Chemist): boolean {
  return MARG_FIELD_LABELS.some(({ key }) => {
    const v = c[key] as string | null;
    return v != null && v !== '';
  });
}

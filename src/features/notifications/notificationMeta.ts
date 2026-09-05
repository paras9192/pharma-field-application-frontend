import { Bell, IndianRupee, ShoppingCart, ClipboardList, Gift, CalendarCheck, type LucideIcon } from 'lucide-react';
import type { AppNotification, NotificationType } from '@/types/api';

export function getNotificationLink(n: Pick<AppNotification, 'type' | 'data'>): string {
  const d = n.data ?? {};
  switch (n.type) {
    case 'PAYMENT_COLLECTED':
    case 'BILL_CREATED':
    case 'BILL_OVERDUE':
    case 'PAYMENT_REMINDER_SENT':
      return d.billId ? `/bills/${d.billId}` : '/bills';
    case 'ORDER_CREATED':
    case 'ORDER_STATUS_CHANGED':
      return d.orderId ? `/orders/${d.orderId}` : '/';
    case 'VISIT_LOGGED':
    case 'GIFT_GIVEN':
    case 'BOOKING_CREATED':
      return d.visitId ? `/visits/${d.visitId}` : '/visits';
    default:
      return '/';
  }
}

const ICON_BY_TYPE: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  PAYMENT_COLLECTED: { icon: IndianRupee, className: 'bg-emerald-50 text-emerald-600' },
  PAYMENT_REMINDER_SENT: { icon: IndianRupee, className: 'bg-emerald-50 text-emerald-600' },
  BILL_CREATED: { icon: IndianRupee, className: 'bg-amber-50 text-amber-600' },
  BILL_OVERDUE: { icon: IndianRupee, className: 'bg-red-50 text-red-600' },
  ORDER_CREATED: { icon: ShoppingCart, className: 'bg-purple-50 text-purple-600' },
  ORDER_STATUS_CHANGED: { icon: ShoppingCart, className: 'bg-purple-50 text-purple-600' },
  VISIT_LOGGED: { icon: ClipboardList, className: 'bg-blue-50 text-blue-600' },
  GIFT_GIVEN: { icon: Gift, className: 'bg-pink-50 text-pink-600' },
  BOOKING_CREATED: { icon: CalendarCheck, className: 'bg-indigo-50 text-indigo-600' },
  GENERAL: { icon: Bell, className: 'bg-teal-50 text-teal-600' },
};

export function getNotificationIcon(type: NotificationType | undefined) {
  return ICON_BY_TYPE[type as NotificationType] ?? ICON_BY_TYPE.GENERAL;
}

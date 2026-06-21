import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Receipt, ChevronDown } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { OrderStatus } from '@/types/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { type AxiosError } from 'axios';

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'];

const statusVariant: Record<OrderStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  DISPATCHED: 'purple',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const NEXT_STATUS: Record<string, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');

  const query = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: () => ordersApi.updateStatus(id!, nextStatus as OrderStatus, statusNotes || undefined),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setShowStatusModal(false);
      setNextStatus('');
      setStatusNotes('');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    },
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const order = query.data;
  if (!order) return null;

  const nextOptions = NEXT_STATUS[order.status] ?? [];
  const progressIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Package size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 font-mono">{order.orderNumber}</span>
              <Badge variant={statusVariant[order.status] as never}>{order.status}</Badge>
            </div>
            <div className="text-sm text-slate-600">{order.chemist.shopName}</div>
            <div className="text-xs text-slate-400 mt-0.5">{order.chemist.ownerName}</div>
          </div>
        </div>

        {/* Status stepper */}
        {order.status !== 'CANCELLED' && (
          <div className="flex items-center gap-1 mt-4">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-1 h-1.5 rounded-full ${i <= progressIdx ? 'bg-blue-500' : 'bg-slate-200'}`} />
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`w-1.5 h-1.5 rounded-full mx-0.5 ${i < progressIdx ? 'bg-blue-500' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        )}
        {order.status !== 'CANCELLED' && (
          <div className="flex justify-between mt-1">
            {STATUS_FLOW.map((s, i) => (
              <span key={s} className={`text-xs ${i <= progressIdx ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {nextOptions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="mt-4"
            onClick={() => { setNextStatus(nextOptions[0]); setShowStatusModal(true); }}
          >
            <ChevronDown size={14} /> Update Status
          </Button>
        )}
      </Card>

      {/* Details */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Order Details</h3>
        <div className="space-y-2 text-sm">
          <Row label="Total Amount" value={`₹${order.totalAmount.toLocaleString('en-IN')}`} />
          {order.expectedDelivery && <Row label="Expected Delivery" value={dayjs(order.expectedDelivery).format('MMM D, YYYY')} />}
          {order.deliveredAt && <Row label="Delivered On" value={dayjs(order.deliveredAt).format('MMM D, YYYY h:mm A')} />}
          {order.deliveredBy && <Row label="Delivered By" value={order.deliveredBy.name} />}
          {order.notes && <Row label="Notes" value={order.notes} />}
          <Row label="Created By" value={order.createdBy.name} />
          <Row label="Created On" value={dayjs(order.createdAt).format('MMM D, YYYY')} />
        </div>
      </Card>

      {/* Items */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Items ({order.items.length})</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={item.id ?? i} className="flex items-start justify-between bg-slate-50 rounded-xl px-3 py-2.5 gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800">{item.productName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {item.quantity} × ₹{item.rate.toLocaleString('en-IN')}
                  {item.notes && ` · ${item.notes}`}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-700 flex-shrink-0">
                ₹{item.amount.toLocaleString('en-IN')}
              </div>
            </div>
          ))}
          <div className="flex justify-between px-3 pt-1 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-sm font-bold text-slate-800">₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </Card>

      {/* Create Bill shortcut */}
      <Link to={`/bills/new?orderId=${order.id}&chemistId=${order.chemistId}&chemistName=${encodeURIComponent(order.chemist.shopName)}&amount=${order.totalAmount}`}>
        <Card className="hover:border-green-200 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Receipt size={16} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">Create Bill for this Order</div>
              <div className="text-xs text-slate-400">Link a bill to track payment</div>
            </div>
          </div>
        </Card>
      </Link>

      {/* Update Status Modal */}
      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Order Status">
        <div className="space-y-4">
          <Select
            label="New Status"
            value={nextStatus}
            onChange={e => setNextStatus(e.target.value as OrderStatus)}
            options={nextOptions.map(s => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
          />
          <Input
            label="Notes (optional)"
            placeholder="e.g. Delivered to shop owner"
            value={statusNotes}
            onChange={e => setStatusNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button fullWidth loading={statusMutation.isPending} onClick={() => statusMutation.mutate()}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-slate-700 text-right">{value}</span>
    </div>
  );
}

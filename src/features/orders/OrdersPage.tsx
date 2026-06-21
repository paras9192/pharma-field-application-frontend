import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ShoppingCart, Package } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Order, OrderStatus } from '@/types/api';
import dayjs from 'dayjs';

const STATUS_OPTS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const statusVariant: Record<OrderStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  DISPATCHED: 'purple',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['orders', { search, status, page }],
    queryFn: () => ordersApi.list({ search: search || undefined, status: (status || undefined) as OrderStatus | undefined, page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Orders</h2>
          {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} total</p>}
        </div>
        <Link to="/orders/new">
          <Button size="sm"><Plus size={16} /> New Order</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search order number, chemist..."
            leftIcon={<Search size={16} />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-40">
          <Select
            options={STATUS_OPTS}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title="No orders found"
          description={search || status ? 'Try different filters' : 'Create your first order'}
          action={!search && !status ? <Link to="/orders/new"><Button size="sm"><Plus size={14} /> New Order</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
          {query.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page} / {query.data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === query.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Link to={`/orders/${order.id}`}>
      <Card className="hover:border-blue-200 transition-colors active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 font-mono text-sm">{order.orderNumber}</span>
              <Badge variant={statusVariant[order.status] as never}>{order.status}</Badge>
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{order.chemist.shopName}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                {order.expectedDelivery && (
                  <span className="text-xs text-slate-400">Due {dayjs(order.expectedDelivery).format('MMM D')}</span>
                )}
                <span className="text-sm font-semibold text-slate-700">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

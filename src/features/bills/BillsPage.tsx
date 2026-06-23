import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Receipt } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { canCreateBill } from '@/utils/permissions';
import { billsApi } from '@/api/bills';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Bill, BillStatus } from '@/types/api';
import dayjs from 'dayjs';

const STATUS_OPTS = [
  { value: '', label: 'All statuses' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
];

const billStatusVariant: Record<BillStatus, string> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
};

export default function BillsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const currentRole = useAuthStore(s => s.user?.role);

  const query = useQuery({
    queryKey: ['bills', { search, status, page }],
    queryFn: () => billsApi.list({ search: search || undefined, status: (status || undefined) as BillStatus | undefined, page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bills</h2>
          {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} total</p>}
        </div>
        {currentRole && canCreateBill(currentRole) && (
          <Link to="/bills/new">
            <Button size="sm"><Plus size={16} /> New Bill</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search bill number, chemist..."
            leftIcon={<Search size={16} />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-36">
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
          icon={<Receipt size={40} />}
          title="No bills found"
          description={search || status ? 'Try different filters' : 'Create your first bill'}
          action={!search && !status ? <Link to="/bills/new"><Button size="sm"><Plus size={14} /> New Bill</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(b => <BillCard key={b.id} bill={b} />)}
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

function BillCard({ bill }: { bill: Bill }) {
  const isOverdue = bill.status !== 'PAID' && bill.dueDate && dayjs(bill.dueDate).isBefore(dayjs(), 'day');

  return (
    <Link to={`/bills/${bill.id}`}>
      <Card className="hover:border-green-200 transition-colors active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Receipt size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 font-mono text-sm">{bill.billNumber}</span>
              <Badge variant={billStatusVariant[bill.status] as never}>{bill.status}</Badge>
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{bill.chemist.shopName}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                {bill.order && <span className="text-xs text-slate-400">Order: {bill.order.orderNumber}</span>}
                {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-700">₹{bill.dueAmount.toLocaleString('en-IN')} due</div>
                {bill.dueDate && (
                  <div className={`text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                    Due {dayjs(bill.dueDate).format('MMM D')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

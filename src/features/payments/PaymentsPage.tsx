import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, CreditCard, TrendingUp } from 'lucide-react';
import { paymentsApi } from '@/api/payments';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Payment } from '@/types/api';
import dayjs from 'dayjs';

const MODE_ICONS: Record<string, string> = {
  CASH: '💵',
  CHEQUE: '📝',
  UPI: '📱',
  NEFT: '🏦',
  BANK_TRANSFER: '🏦',
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['payments-summary', { from, to }],
    queryFn: () => paymentsApi.summary({ from: from || undefined, to: to || undefined }),
    select: r => r.data.data,
  });

  const listQuery = useQuery({
    queryKey: ['payments', { page, from, to }],
    queryFn: () => paymentsApi.list({ page, limit: 20, from: from || undefined, to: to || undefined }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800">Payments</h2>

      {/* Date Filter */}
      <div className="flex gap-2">
        <Input type="date" label="From" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
        <Input type="date" label="To" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
      </div>

      {/* Summary Card */}
      {summaryQuery.data && (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
          <div className="flex items-center justify-between text-white mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} />
              <span className="font-semibold">Collection Summary</span>
            </div>
            <span className="text-blue-200 text-sm">{summaryQuery.data.totalTransactions} transactions</span>
          </div>
          <div className="text-3xl font-bold text-white mb-4">
            ₹{summaryQuery.data.totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {summaryQuery.data.byMode.map(m => (
              <div key={m.mode} className="bg-white/10 rounded-xl p-2 text-center">
                <div className="text-lg">{MODE_ICONS[m.mode] ?? '💳'}</div>
                <div className="text-white font-semibold text-sm">₹{m.amount.toLocaleString('en-IN')}</div>
                <div className="text-blue-200 text-xs">{m.mode.replace('_', ' ')} ({m.count})</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment List */}
      {listQuery.isLoading ? (
        <ListSkeleton />
      ) : listQuery.isError ? (
        <ErrorMessage onRetry={listQuery.refetch} />
      ) : !listQuery.data?.data?.length ? (
        <EmptyState
          icon={<CreditCard size={40} />}
          title="No payments found"
          description="Payments collected against bills will appear here"
        />
      ) : (
        <>
          <div className="space-y-2">
            {listQuery.data.data.map(p => <PaymentRow key={p.id} payment={p} />)}
          </div>
          {listQuery.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page} / {listQuery.data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === listQuery.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
          {MODE_ICONS[payment.paymentMode] ?? '💳'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">₹{payment.amount.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400">{dayjs(payment.createdAt).format('MMM D, YYYY')}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {payment.paymentMode.replace('_', ' ')}
            {payment.referenceNumber && ` · ${payment.referenceNumber}`}
            {payment.bill && ` · ${payment.bill.billNumber}`}
          </div>
          {payment.collectedBy && <div className="text-xs text-slate-400">{payment.collectedBy.name}</div>}
        </div>
        <IndianRupee size={14} className="text-green-500 flex-shrink-0" />
      </div>
    </Card>
  );
}

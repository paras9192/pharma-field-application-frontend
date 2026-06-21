import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  IndianRupee, TrendingUp, AlertCircle, CreditCard, Clock, Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { dashboardApi } from '@/api/dashboard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { EmptyState } from '@/components/feedback/EmptyState';
import dayjs from 'dayjs';
import type { PaymentsDashboard } from '@/types/api';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PaymentsDashboardPage() {
  const { isAdmin } = useAuthStore(useShallow(s => ({ isAdmin: s.isAdmin() })));

  const query = useQuery({
    queryKey: ['dashboard', 'payments'],
    queryFn: () => dashboardApi.payments(),
    select: r => r.data.data,
    retry: false,
  });

  if (query.isLoading) return (
    <div className="p-4 max-w-2xl mx-auto">
      <ListSkeleton count={5} />
    </div>
  );

  if (query.isError || !query.data) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <ErrorMessage onRetry={() => query.refetch()} />
      </div>
    );
  }

  return <PaymentsDashboardView data={query.data} isAdmin={isAdmin} />;
}

function PaymentsDashboardView({ data, isAdmin }: { data: PaymentsDashboard; isAdmin: boolean }) {
  const kpi = data.kpi;

  const agingRows = [
    { label: 'Due Today', bucket: data.aging.dueToday, color: 'text-red-600' },
    { label: '1–7 Days', bucket: data.aging.due1to7Days, color: 'text-amber-600' },
    { label: '8–15 Days', bucket: data.aging.due8to15Days, color: 'text-orange-500' },
    { label: '16–30 Days', bucket: data.aging.due16to30Days, color: 'text-slate-700' },
    { label: '30+ Days Overdue', bucket: data.aging.overdue30plus, color: 'text-red-700' },
  ];

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Payment Analytics</h2>
        <p className="text-sm text-slate-400">{dayjs().format('MMMM YYYY')}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <TrendingUp size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{fmt(kpi.totalCollected)}</div>
          <div className="text-xs font-medium text-slate-600">Total Collected</div>
          <div className="text-xs text-slate-400">{kpi.totalTransactions} transactions</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <IndianRupee size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{fmt(kpi.totalOutstanding)}</div>
          <div className="text-xs font-medium text-slate-600">Outstanding</div>
          <div className="text-xs text-slate-400">{fmt(kpi.totalBillValue)} total billed</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <CreditCard size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.collectionRate.toFixed(1)}%</div>
          <div className="text-xs font-medium text-slate-600">Collection Rate</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <AlertCircle size={18} />
          </div>
          <div className="text-sm font-bold text-slate-800 leading-tight">
            <span className="text-green-600">{kpi.paidCount}</span>
            {' / '}
            <span className="text-amber-600">{kpi.partialCount}</span>
            {' / '}
            <span className="text-red-600">{kpi.unpaidCount}</span>
          </div>
          <div className="text-xs font-medium text-slate-600 mt-0.5">Paid / Partial / Unpaid</div>
          <div className="text-xs text-slate-400">{kpi.totalBills} total bills</div>
        </Card>
      </div>

      {/* Aging Buckets */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" /> Bill Aging
        </h3>
        <div className="space-y-2">
          {agingRows.map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="flex-1 text-sm text-slate-700">{row.label}</div>
              <div className={`text-sm font-semibold ${row.color}`}>{fmt(row.bucket.amount)}</div>
              <Badge variant="default">{row.bucket.count}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Mode Breakdown */}
      {data.paymentModes.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CreditCard size={16} className="text-slate-500" /> Payment Modes
          </h3>
          <div className="space-y-2">
            {data.paymentModes.map(pm => (
              <div key={pm.mode} className="flex items-center gap-3">
                <div className="flex-1 text-sm text-slate-700">{pm.mode}</div>
                <div className="text-sm font-semibold text-slate-800">{fmt(pm.amount)}</div>
                <Badge variant="info">{pm.count} txns</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Collections */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-blue-500" /> Upcoming Collections
        </h3>
        {data.upcomingCollections.length === 0 ? (
          <EmptyState title="No upcoming collections" description="Collections due in the next 7 days will appear here" />
        ) : (
          <div className="space-y-2">
            {data.upcomingCollections.map(item => {
              const days = item.daysUntilDue;
              const dayBadge = days === 0
                ? <Badge variant="danger">Due Today</Badge>
                : days <= 3
                  ? <Badge variant="warning">{days}d left</Badge>
                  : <Badge variant="info">{days}d left</Badge>;

              return (
                <Link
                  key={item.id}
                  to={`/bills/${item.id}`}
                  className="flex items-start gap-3 hover:bg-slate-50 -mx-1 px-1 rounded-xl py-1 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{item.chemist.shopName}</div>
                    <div className="text-xs text-slate-400">
                      #{item.billNumber} · {dayjs(item.dueDate).format('MMM D')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold text-slate-800">{fmt(item.dueAmount)}</div>
                    {dayBadge}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* High Risk Accounts */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" /> High Risk Accounts (30+ days overdue)
        </h3>
        {data.highRiskAccounts.length === 0 ? (
          <EmptyState title="No high risk accounts" description="Great! No bills are 30+ days overdue." />
        ) : (
          <div className="space-y-2">
            {data.highRiskAccounts.map(item => (
              <Link
                key={item.id}
                to={`/bills/${item.id}`}
                className="flex items-start gap-3 hover:bg-red-50 -mx-1 px-1 rounded-xl py-1 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{item.chemist.shopName}</div>
                  <div className="text-xs text-slate-400">
                    #{item.billNumber} · Due {dayjs(item.dueDate).format('MMM D')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-sm font-semibold text-red-600">{fmt(item.dueAmount)}</div>
                  <Badge variant="danger">{item.daysOverdue}d overdue</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Salesperson Ranking (admin only) */}
      {isAdmin && data.salespersonRanking && data.salespersonRanking.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Salesperson Ranking
          </h3>
          <div className="space-y-2">
            {data.salespersonRanking.map(sp => (
              <div key={sp.user.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${sp.rank === 1 ? 'bg-yellow-100 text-yellow-700' : sp.rank === 2 ? 'bg-slate-100 text-slate-600' : sp.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                  {sp.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{sp.user.name}</div>
                  <div className="text-xs text-slate-400">{sp.transactions} txns</div>
                </div>
                <div className="text-sm font-semibold text-green-600">{fmt(sp.totalCollected)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

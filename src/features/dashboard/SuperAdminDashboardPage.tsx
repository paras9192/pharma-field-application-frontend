import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertCircle, TrendingUp, Users, CalendarCheck, IndianRupee,
  Receipt, Stethoscope, Clock, CreditCard, ClipboardList,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { EmptyState } from '@/components/feedback/EmptyState';
import dayjs from 'dayjs';
import type { SuperAdminDashboard } from '@/types/api';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}

function KpiCard({ icon, label, value, sub, colorClass = 'bg-blue-50 text-blue-600' }: KpiCardProps) {
  return (
    <Card padding="sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colorClass}`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-800 truncate">{value}</div>
      <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

export default function SuperAdminDashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard', 'super-admin'],
    queryFn: () => dashboardApi.superAdmin(),
    select: r => r.data.data,
    retry: false,
  });

  if (query.isLoading) return <ListSkeleton count={4} />;
  if (query.isError || !query.data) {
    return <ErrorMessage onRetry={() => query.refetch()} />;
  }

  return <SuperAdminView data={query.data} />;
}

function SuperAdminView({ data }: { data: SuperAdminDashboard }) {
  const kpi = data.kpi;
  const alerts = data.alerts;
  const [leaderTab, setLeaderTab] = useState<'sales' | 'mr'>('sales');

  // Merge and sort recent activity
  const allActivity = [
    ...data.recentActivity.payments,
    ...data.recentActivity.bills,
  ]
    .sort((a, b) => dayjs(b.at).valueOf() - dayjs(a.at).valueOf())
    .slice(0, 10);

  const hasAlerts =
    alerts.overdueCount > 0 || alerts.pendingFollowUps > 0 || alerts.employeesAbsent > 0;

  return (
    <div className="space-y-5">
      {/* Alerts bar */}
      {hasAlerts && (
        <Card padding="sm" className="border-l-4 border-l-red-500">
          <div className="flex flex-wrap gap-2">
            {alerts.overdueCount > 0 && (
              <Link to="/bills">
                <Badge variant="danger">
                  <AlertCircle size={11} className="mr-1" />
                  {alerts.overdueCount} Overdue Bills
                </Badge>
              </Link>
            )}
            {alerts.pendingFollowUps > 0 && (
              <Badge variant="warning">
                <Clock size={11} className="mr-1" />
                {alerts.pendingFollowUps} Follow-ups
              </Badge>
            )}
            {alerts.employeesAbsent > 0 && (
              <Badge variant="default">
                <Users size={11} className="mr-1" />
                {alerts.employeesAbsent} Absent
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={<IndianRupee size={18} />}
          label="Total Bill Value"
          value={fmt(kpi.totalBillValue)}
          colorClass="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Total Collected"
          value={fmt(kpi.totalCollected)}
          colorClass="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={<Receipt size={18} />}
          label="Outstanding"
          value={fmt(kpi.totalOutstanding)}
          colorClass="bg-amber-50 text-amber-600"
        />
        <KpiCard
          icon={<CreditCard size={18} />}
          label="Collection Rate"
          value={`${kpi.collectionRate.toFixed(1)}%`}
          colorClass="bg-purple-50 text-purple-600"
        />
        <KpiCard
          icon={<AlertCircle size={18} />}
          label="Overdue Bills"
          value={kpi.overdueCount}
          sub={fmt(kpi.overdueAmount)}
          colorClass="bg-red-50 text-red-600"
        />
        <KpiCard
          icon={<CalendarCheck size={18} />}
          label="Present Today"
          value={`${kpi.presentToday}/${kpi.totalEmployees}`}
          sub={`${kpi.attendanceRate.toFixed(0)}% attendance`}
          colorClass="bg-teal-50 text-teal-600"
        />
        <KpiCard
          icon={<ClipboardList size={18} />}
          label="Visits Today"
          value={kpi.visitsToday}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          icon={<Clock size={18} />}
          label="Pending Follow-ups"
          value={kpi.pendingFollowUps}
          colorClass="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/bills">
          <Card padding="sm" className="flex items-center gap-2 hover:border-blue-200 transition-colors">
            <Receipt size={16} className="text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-xs text-slate-400">Bills Today</div>
              <div className="font-semibold text-slate-800">{kpi.billsToday}</div>
            </div>
          </Card>
        </Link>
        <Card padding="sm" className="flex items-center gap-2">
          <Stethoscope size={16} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400">Doctors</div>
            <div className="font-semibold text-slate-800">{kpi.totalDoctors}</div>
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" /> Leaderboard
          </h3>
          <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs">
            <button
              onClick={() => setLeaderTab('sales')}
              className={`px-3 py-1.5 font-medium transition-colors ${leaderTab === 'sales' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Sales
            </button>
            <button
              onClick={() => setLeaderTab('mr')}
              className={`px-3 py-1.5 font-medium transition-colors ${leaderTab === 'mr' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              MR
            </button>
          </div>
        </div>

        {leaderTab === 'sales' ? (
          data.leaderboard.salespersons.length === 0 ? (
            <EmptyState title="No data yet" description="Sales leaderboard will appear here" />
          ) : (
            <div className="space-y-2">
              {data.leaderboard.salespersons.map(sp => (
                <div key={sp.user.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${sp.rank === 1 ? 'bg-yellow-100 text-yellow-700' : sp.rank === 2 ? 'bg-slate-100 text-slate-600' : sp.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                    {sp.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{sp.user.name}</div>
                    <div className="text-xs text-slate-400">{sp.transactions} txns</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">{fmt(sp.collected)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          data.leaderboard.mrs.length === 0 ? (
            <EmptyState title="No data yet" description="MR leaderboard will appear here" />
          ) : (
            <div className="space-y-2">
              {data.leaderboard.mrs.map(mr => (
                <div key={mr.user.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${mr.rank === 1 ? 'bg-yellow-100 text-yellow-700' : mr.rank === 2 ? 'bg-slate-100 text-slate-600' : mr.rank === 3 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
                    {mr.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{mr.user.name}</div>
                    <div className="text-xs text-slate-400">{mr.user.role.name}</div>
                  </div>
                  <Badge variant="info">{mr.visitsThisMonth} visits</Badge>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" /> Recent Activity
        </h3>
        {allActivity.length === 0 ? (
          <EmptyState title="No recent activity" />
        ) : (
          <div className="space-y-2">
            {allActivity.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${item.type === 'PAYMENT' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {item.type === 'PAYMENT'
                    ? <IndianRupee size={14} className="text-green-600" />
                    : <Receipt size={14} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{item.description}</div>
                  <div className="text-xs text-slate-400">{dayjs(item.at).format('MMM D, h:mm A')}</div>
                </div>
                <div className="text-sm font-semibold text-slate-700 flex-shrink-0">
                  {item.type === 'PAYMENT'
                    ? <span className="text-green-600">{fmt((item as { amount: number }).amount)}</span>
                    : <span>{fmt((item as { amount: number }).amount)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <Link to="/payments" className="mt-3 block text-center text-xs text-blue-600 font-medium hover:underline">
          View all payments →
        </Link>
      </Card>
    </div>
  );
}


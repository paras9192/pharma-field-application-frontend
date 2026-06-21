import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, IndianRupee, AlertCircle, ClipboardList, Pill, Clock,
  Stethoscope, TrendingUp, Users,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { EmptyState } from '@/components/feedback/EmptyState';
import dayjs from 'dayjs';
import type { SalesPersonDashboard } from '@/types/api';

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-50 border-l-red-500',
  MEDIUM: 'bg-amber-50 border-l-amber-500',
  LOW: 'bg-blue-50 border-l-blue-500',
};

const priorityBadge: Record<string, 'danger' | 'warning' | 'info'> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
};

const visitStatusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  CANCELLED: 'default',
};

export default function SalesPersonDashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard', 'sales-person'],
    queryFn: () => dashboardApi.salesPerson(),
    select: r => r.data.data,
    retry: false,
  });

  if (query.isLoading) return <ListSkeleton count={4} />;
  if (query.isError || !query.data) {
    return <ErrorMessage onRetry={() => query.refetch()} />;
  }

  return <SalesPersonView data={query.data} />;
}

function SalesPersonView({ data }: { data: SalesPersonDashboard }) {
  const att = data.attendance;
  const kpi = data.kpi;
  const mp = data.monthlyPerformance;

  return (
    <div className="space-y-5">
      {/* Attendance card */}
      <Card className={att ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-400'}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Today's Attendance</div>
            {att ? (
              <div className="mt-1">
                <Badge variant="success">{att.status}</Badge>
                <div className="text-xs text-slate-400 mt-1">
                  {att.checkInTime ? `In: ${dayjs(att.checkInTime).format('h:mm A')}` : ''}
                  {att.checkOutTime ? ` · Out: ${dayjs(att.checkOutTime).format('h:mm A')}` : ''}
                  {att.workingHours != null ? ` · ${att.workingHours}h` : ''}
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-amber-600 mt-0.5">Not checked in</div>
            )}
          </div>
          <Link to="/attendance">
            <CalendarCheck size={28} className={att ? 'text-green-500' : 'text-amber-400'} />
          </Link>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <IndianRupee size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{fmt(kpi.todayCollected)}</div>
          <div className="text-xs font-medium text-slate-600">Today Collected</div>
          <div className="text-xs text-slate-400">{kpi.todayTransactions} txns</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <ClipboardList size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.pendingBills}</div>
          <div className="text-xs font-medium text-slate-600">Pending Bills</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2">
            <AlertCircle size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.overdueCount}</div>
          <div className="text-xs font-medium text-slate-600">Overdue Bills</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <TrendingUp size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.todayVisits}</div>
          <div className="text-xs font-medium text-slate-600">Visits Today</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Clock size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.pendingFollowUps}</div>
          <div className="text-xs font-medium text-slate-600">Follow-ups</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <Users size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.totalAssignedChemists}</div>
          <div className="text-xs font-medium text-slate-600">Assigned Chemists</div>
        </Card>
      </div>

      {/* Monthly performance */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" /> This Month
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-400">Bills Created</div>
            <div className="font-bold text-slate-800">{mp.billsCreated}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Bill Value</div>
            <div className="font-bold text-slate-800">{fmt(mp.billValue)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Collected</div>
            <div className="font-bold text-green-600">{fmt(mp.collected)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Transactions</div>
            <div className="font-bold text-slate-800">{mp.transactions}</div>
          </div>
        </div>
      </Card>

      {/* Collection Tasks */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <IndianRupee size={16} className="text-green-600" /> Collection Tasks
        </h3>
        {data.collectionTasks.length === 0 ? (
          <EmptyState title="No collection tasks" description="All caught up!" />
        ) : (
          <div className="space-y-2">
            {data.collectionTasks.map(task => (
              <Link
                key={task.id}
                to={`/bills/${task.id}`}
                className={`block border-l-4 rounded-r-xl p-3 hover:opacity-80 transition-opacity ${priorityColors[task.priority] ?? 'bg-slate-50 border-l-slate-300'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{task.chemist.shopName}</div>
                    <div className="text-xs text-slate-500">#{task.billNumber} · Due {dayjs(task.dueDate).format('MMM D')}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-sm font-bold text-slate-800">{fmt(task.dueAmount)}</div>
                    <Badge variant={priorityBadge[task.priority] ?? 'default'}>
                      {task.daysUntilDue === 0 ? 'Due Today' : `${task.daysUntilDue}d`}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Overdue Bills */}
      {data.overdueBills.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" /> Overdue Bills
          </h3>
          <div className="space-y-2">
            {data.overdueBills.map(bill => (
              <Link
                key={bill.id}
                to={`/bills/${bill.id}`}
                className="flex items-start gap-3 bg-red-50 rounded-xl p-3 hover:bg-red-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{bill.chemist.shopName}</div>
                  <div className="text-xs text-slate-500">#{bill.billNumber} · Due {dayjs(bill.dueDate).format('MMM D')}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="text-sm font-bold text-red-600">{fmt(bill.dueAmount)}</div>
                  <Badge variant="danger">{bill.daysOverdue}d overdue</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <CalendarCheck size={16} className="text-blue-600" /> Today's Schedule
        </h3>
        {data.todaySchedule.length === 0 ? (
          <EmptyState title="No visits scheduled" description="Your visits for today will appear here" />
        ) : (
          <div className="space-y-2">
            {data.todaySchedule.map(visit => (
              <div key={visit.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${visit.visitType === 'DOCTOR' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {visit.visitType === 'DOCTOR'
                    ? <Stethoscope size={14} className="text-blue-600" />
                    : <Pill size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {visit.visitType === 'DOCTOR' ? visit.doctor?.name : visit.chemist?.shopName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {dayjs(visit.visitTime).format('h:mm A')}
                    {visit.purpose ? ` · ${visit.purpose}` : ''}
                  </div>
                </div>
                <Badge variant={visitStatusVariant[visit.status] ?? 'default'}>{visit.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

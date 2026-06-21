import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, TrendingUp, AlertCircle, Clock, Stethoscope, Pill, FileText,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { EmptyState } from '@/components/feedback/EmptyState';
import dayjs from 'dayjs';
import type { MRDashboard, VisitStatus } from '@/types/api';

const visitStatusVariant: Record<VisitStatus, 'success' | 'warning' | 'default'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  CANCELLED: 'default',
};

const reportStatusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  SUBMITTED: 'success',
  DRAFT: 'warning',
};

export default function MRDashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard', 'mr'],
    queryFn: () => dashboardApi.mr(),
    select: r => r.data.data,
    retry: false,
  });

  if (query.isLoading) return <ListSkeleton count={4} />;
  if (query.isError || !query.data) {
    return <ErrorMessage onRetry={() => query.refetch()} />;
  }

  return <MRView data={query.data} />;
}

function MRView({ data }: { data: MRDashboard }) {
  const att = data.attendance;
  const kpi = data.kpi;
  const mb = data.monthlyBreakdown;

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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <TrendingUp size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.todayVisits}</div>
          <div className="text-xs font-medium text-slate-600">Visits Today</div>
          <div className="text-xs text-slate-400">{kpi.completedVisitsToday} completed</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <CalendarCheck size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.totalVisitsThisMonth}</div>
          <div className="text-xs font-medium text-slate-600">This Month</div>
          <div className="text-xs text-slate-400">Avg {kpi.avgVisitsPerDay.toFixed(1)}/day</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Clock size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">{kpi.pendingFollowUps}</div>
          <div className="text-xs font-medium text-slate-600">Pending Follow-ups</div>
        </Card>

        <Card padding="sm">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <FileText size={18} />
          </div>
          <div className="text-xl font-bold text-slate-800">
            <Badge variant={reportStatusVariant[kpi.reportStatus] ?? 'default'}>
              {kpi.reportStatus}
            </Badge>
          </div>
          <div className="text-xs font-medium text-slate-600 mt-1">Daily Report</div>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" /> Monthly Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-slate-400">Total Visits</div>
            <div className="font-bold text-slate-800">{mb.totalVisits}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Doctor Visits</div>
            <div className="font-bold text-slate-800">{mb.doctorVisits}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Chemist Visits</div>
            <div className="font-bold text-slate-800">{mb.chemistVisits}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Completion Rate</div>
            <div className="font-bold text-slate-800">{mb.completionRate.toFixed(1)}%</div>
          </div>
        </div>
        {/* Completion rate progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(mb.completionRate, 100)}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 mt-1 text-right">{mb.completionRate.toFixed(1)}% completion</div>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <CalendarCheck size={16} className="text-blue-600" /> Today's Schedule
        </h3>
        {data.todaySchedule.length === 0 ? (
          <EmptyState title="No visits scheduled today" />
        ) : (
          <div className="space-y-2">
            {[...data.todaySchedule]
              .sort((a, b) => dayjs(a.visitTime).valueOf() - dayjs(b.visitTime).valueOf())
              .map(visit => (
                <div key={visit.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                    ${visit.visitType === 'DOCTOR' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {visit.visitType === 'DOCTOR'
                      ? <Stethoscope size={14} className="text-blue-600" />
                      : <Pill size={14} className="text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {visit.visitType === 'DOCTOR'
                        ? visit.doctor?.name
                        : visit.chemist?.shopName}
                    </div>
                    {visit.visitType === 'DOCTOR' && visit.doctor?.specialization && (
                      <div className="text-xs text-slate-400">{visit.doctor.specialization}</div>
                    )}
                    <div className="text-xs text-slate-400">
                      {dayjs(visit.visitTime).format('h:mm A')}
                      {visit.purpose ? ` · ${visit.purpose}` : ''}
                    </div>
                    {visit.products.length > 0 && (
                      <div className="text-xs text-blue-500 mt-0.5">
                        {visit.products.map(p => p.productName).join(', ')}
                      </div>
                    )}
                  </div>
                  <Badge variant={visitStatusVariant[visit.status] ?? 'default'}>{visit.status}</Badge>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Upcoming Follow-ups */}
      {data.upcomingFollowUps.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Upcoming Follow-ups
          </h3>
          <div className="space-y-2">
            {data.upcomingFollowUps.slice(0, 10).map(v => (
              <div key={v.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${v.visitType === 'DOCTOR' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {v.visitType === 'DOCTOR'
                    ? <Stethoscope size={14} className="text-blue-600" />
                    : <Pill size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {v.visitType === 'DOCTOR' ? v.doctor?.name : v.chemist?.shopName}
                  </div>
                  {v.followUpNotes && (
                    <div className="text-xs text-slate-400 truncate">{v.followUpNotes}</div>
                  )}
                </div>
                <Badge variant="warning">{dayjs(v.followUpDate).format('MMM D')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-slate-500" /> Recent Activity
          </h3>
          <div className="space-y-2">
            {data.recentActivity.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${v.visitType === 'DOCTOR' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {v.visitType === 'DOCTOR'
                    ? <Stethoscope size={14} className="text-blue-600" />
                    : <Pill size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {v.visitType === 'DOCTOR' ? v.doctor?.name : v.chemist?.shopName}
                  </div>
                  <div className="text-xs text-slate-400">{dayjs(v.visitDate).format('MMM D, YYYY')}</div>
                </div>
                <Badge variant={visitStatusVariant[v.status] ?? 'default'}>{v.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

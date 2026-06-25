import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, TrendingUp, AlertCircle, Stethoscope, Pill, FileText, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { dashboardApi } from '@/api/dashboard';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import dayjs from 'dayjs';
import type { AdminDashboard, EmployeeDashboard } from '@/types/api';
import SuperAdminDashboardPage from './SuperAdminDashboardPage';
import SalesPersonDashboardPage from './SalesPersonDashboardPage';
import MRDashboardPage from './MRDashboardPage';

export default function DashboardPage() {
  const { user, isAdmin } = useAuthStore(useShallow(s => ({
    user: s.user,
    isAdmin: s.isAdmin(),
  })));

  const role = user?.role;

  const adminQuery = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.admin(),
    enabled: isAdmin && role !== 'SUPER_ADMIN' && role !== 'ADMIN',
    select: r => r.data.data,
  });

  const meQuery = useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: () => dashboardApi.me(),
    enabled: !isAdmin,
    select: r => r.data.data,
  });

  const greeting = (
    <div>
      <h2 className="text-xl font-bold text-slate-800">
        Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
      </h2>
      <p className="text-sm text-slate-400">{dayjs().format('dddd, MMMM D, YYYY')}</p>
    </div>
  );

  // Route by role to the appropriate dashboard
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return (
      <div className="p-4 space-y-5 max-w-2xl mx-auto lg:max-w-4xl">
        {greeting}
        <SuperAdminDashboardPage />
      </div>
    );
  }

  if (role === 'SALES_PERSON') {
    return (
      <div className="p-4 space-y-5 max-w-2xl mx-auto lg:max-w-4xl">
        {greeting}
        <SalesPersonDashboardPage />
      </div>
    );
  }

  if (role === 'MR' || role === 'ASM' || role === 'ZSM') {
    return (
      <div className="p-4 space-y-5 max-w-2xl mx-auto lg:max-w-4xl">
        {greeting}
        <MRDashboardPage />
      </div>
    );
  }

  // Fallback: legacy admin/employee dashboards
  const isLoading = isAdmin ? adminQuery.isLoading : meQuery.isLoading;
  const isError = isAdmin ? adminQuery.isError : meQuery.isError;

  if (isLoading) return <ListSkeleton count={4} />;
  if (isError) return <ErrorMessage />;

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto lg:max-w-4xl">
      {greeting}

      {isAdmin ? (
        <AdminDashboardView data={adminQuery.data as AdminDashboard} />
      ) : (
        <EmployeeDashboardView data={meQuery.data as EmployeeDashboard} />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function AdminDashboardView({ data }: { data: AdminDashboard }) {
  if (!data || !data.summary) return null;
  const s = data.summary;

  return (
    <div className="space-y-5">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users size={20} />} color="blue" label="Total Employees" value={s.totalEmployees} sub={`${s.activeEmployees} active`} />
        <StatCard icon={<CalendarCheck size={20} />} color="green" label="Present Today" value={s.presentToday} sub={`${s.absentToday} absent`} />
        <StatCard icon={<TrendingUp size={20} />} color="purple" label="Visits Today" value={s.totalVisitsToday} sub={`${s.doctorVisitsToday}D / ${s.chemistVisitsToday}C`} />
        <StatCard icon={<AlertCircle size={20} />} color="amber" label="Pending Follow-ups" value={s.pendingFollowUps} sub="Need action" />
        <StatCard icon={<Stethoscope size={20} />} color="teal" label="Doctors" value={s.totalDoctors} sub="In database" />
        <StatCard icon={<Pill size={20} />} color="indigo" label="Chemists" value={s.totalChemists} sub="In database" />
      </div>

      {/* Top Performers */}
      {data.topPerformers?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" /> Top Performers Today
          </h3>
          <div className="space-y-2">
            {data.topPerformers.slice(0, 5).map((p, i) => (
              <div key={p.user.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{p.user.name}</div>
                  <div className="text-xs text-slate-400">{p.user.role.name}</div>
                </div>
                <Badge variant="info">{p.visitCount} visits</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Present Employees */}
      {data.presentEmployees?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CalendarCheck size={16} className="text-green-600" /> Present Today ({data.presentEmployees.length})
          </h3>
          <div className="space-y-2">
            {data.presentEmployees.slice(0, 8).map(att => (
              <div key={att.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                  {att.user.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">{att.user.name}</div>
                  <div className="text-xs text-slate-400">
                    In: {dayjs(att.checkInTime).format('h:mm A')}
                    {att.checkOutTime && ` · Out: ${dayjs(att.checkOutTime).format('h:mm A')}`}
                  </div>
                </div>
                <Badge variant={att.checkOutTime ? 'default' : 'success'}>
                  {att.checkOutTime ? att.workingHours ?? 'Done' : 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reports submitted */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Reports Submitted</span>
          </div>
          <span className="font-bold text-slate-800">{s.reportsSubmittedToday}</span>
        </div>
      </Card>
    </div>
  );
}

function EmployeeDashboardView({ data }: { data: EmployeeDashboard }) {
  if (!data) return null;
  const s = data.summary;
  const att = data.attendance;

  return (
    <div className="space-y-5">
      {/* Attendance Card */}
      <Card className={att ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-400'}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Today's Attendance</div>
            {att ? (
              <div className="mt-1">
                <Badge variant="success">{att.status}</Badge>
                <div className="text-xs text-slate-400 mt-1">
                  In: {dayjs(att.checkInTime).format('h:mm A')}
                  {att.checkOutTime && ` · Out: ${dayjs(att.checkOutTime).format('h:mm A')}`}
                  {att.workingHours && ` · ${att.workingHours}h`}
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-amber-600 mt-0.5">Not checked in</div>
            )}
          </div>
          <CalendarCheck size={28} className={att ? 'text-green-500' : 'text-amber-400'} />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<TrendingUp size={20} />} color="blue" label="Visits Today" value={s.todayVisits} sub={`${s.doctorVisitsToday}D / ${s.chemistVisitsToday}C`} />
        <StatCard icon={<AlertCircle size={20} />} color="amber" label="Follow-ups" value={s.pendingFollowUps} sub="Pending" />
        <StatCard icon={<TrendingUp size={20} />} color="green" label="This Month" value={s.totalVisitsMonth} sub="Total visits" />
        <StatCard
          icon={<FileText size={20} />}
          color={s.reportStatus === 'SUBMITTED' ? 'green' : s.reportStatus === 'DRAFT' ? 'amber' : 'slate'}
          label="Daily Report"
          value={s.reportStatus === 'NOT_CREATED' ? '—' : s.reportStatus}
          sub={s.reportStatus === 'SUBMITTED' ? 'Submitted' : s.reportStatus === 'DRAFT' ? 'Draft saved' : 'Not created'}
        />
      </div>

      {/* Recent Visits */}
      {data.recentVisits?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3">Recent Visits</h3>
          <div className="space-y-2">
            {data.recentVisits.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${v.visitType === 'DOCTOR' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {v.visitType === 'DOCTOR' ? <Stethoscope size={14} className="text-blue-600" /> : <Pill size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {v.visitType === 'DOCTOR' ? v.doctor?.name : v.chemist?.shopName}
                  </div>
                  <div className="text-xs text-slate-400">{dayjs(v.visitDate).format('MMM D')}</div>
                </div>
                <Badge variant={v.status === 'COMPLETED' ? 'success' : 'warning'}>{v.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Follow-ups */}
      {data.upcomingFollowUps?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Upcoming Follow-ups
          </h3>
          <div className="space-y-2">
            {data.upcomingFollowUps.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {v.visitType === 'DOCTOR' ? v.doctor?.name : v.chemist?.shopName}
                  </div>
                  <div className="text-xs text-slate-400">{v.followUpNotes}</div>
                </div>
                <Badge variant="warning">{dayjs(v.followUpDate).format('MMM D')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon, color, label, value, sub,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number | string;
  sub: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    teal: 'bg-teal-50 text-teal-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <Card padding="sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color] ?? colors.blue}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </Card>
  );
}

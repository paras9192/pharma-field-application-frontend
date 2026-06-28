import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Stethoscope, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { visitsApi } from '@/api/visits';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Visit, VisitStatus } from '@/types/api';
import dayjs from 'dayjs';

type TabType = 'all' | 'today' | 'followups';

export default function VisitsPage() {
  const [tab, setTab] = useState<TabType>('today');
  const [page, setPage] = useState(1);
  const today = dayjs().format('YYYY-MM-DD');

  const allQuery = useQuery({
    queryKey: ['visits', 'all', page],
    queryFn: () => visitsApi.list({ page, limit: 20 }),
    select: r => r.data,
    enabled: tab === 'all',
  });

  const todayQuery = useQuery({
    queryKey: ['visits', 'today'],
    queryFn: () => visitsApi.list({ from: today, to: today, limit: 50 }),
    select: r => r.data,
    enabled: tab === 'today',
  });

  const followUpsQuery = useQuery({
    queryKey: ['visits', 'followups'],
    queryFn: () => visitsApi.pendingFollowUps(),
    select: r => r.data.data,
    enabled: tab === 'followups',
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'today', label: "Today" },
    { key: 'all', label: 'All Visits' },
    { key: 'followups', label: 'Follow-ups' },
  ];

  const isLoading = tab === 'all' ? allQuery.isLoading : tab === 'today' ? todayQuery.isLoading : followUpsQuery.isLoading;
  const isError = tab === 'all' ? allQuery.isError : tab === 'today' ? todayQuery.isError : followUpsQuery.isError;
  const visits = tab === 'all' ? allQuery.data?.data : tab === 'today' ? todayQuery.data?.data : followUpsQuery.data;
  const meta = tab === 'all' ? allQuery.data?.meta : tab === 'today' ? todayQuery.data?.meta : undefined;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Visits</h2>
        <Link to="/visits/new">
          <Button size="sm"><Plus size={16} /> Log Visit</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorMessage />
      ) : !visits?.length ? (
        <EmptyState
          icon={tab === 'followups' ? <AlertCircle size={40} /> : <Stethoscope size={40} />}
          title={tab === 'followups' ? 'No pending follow-ups' : tab === 'today' ? 'No visits today' : 'No visits found'}
          action={tab !== 'followups' ? <Link to="/visits/new"><Button size="sm">Log a Visit</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {visits.map(v => <VisitCard key={v.id} visit={v} showFollowUp={tab === 'followups'} />)}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page}/{meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VisitCard({ visit, showFollowUp }: { visit: Visit; showFollowUp?: boolean }) {
  const isDoctor = visit.visitType === 'DOCTOR';
  const name = isDoctor ? visit.doctor?.name : visit.chemist?.shopName;
  const sub = isDoctor ? visit.doctor?.specialization : visit.chemist?.ownerName;

  return (
    <Link to={`/visits/${visit.id}`}>
      <Card hover className="hover:border-blue-200 active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDoctor ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {isDoctor ? <Stethoscope size={18} className="text-blue-600" /> : <ShoppingBag size={18} className="text-purple-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-800 truncate">{name}</div>
              <VisitStatusBadge status={visit.status} />
            </div>
            {sub && <div className="text-xs text-slate-500">{sub}</div>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{dayjs(visit.visitDate).format('MMM D, YYYY')}</span>
              {visit.territory && <span className="text-xs text-slate-400">• {visit.territory.name}</span>}
            </div>
            {showFollowUp && visit.followUpDate && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                <Clock size={11} /> Follow up: {dayjs(visit.followUpDate).format('MMM D')}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const map: Record<VisitStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    COMPLETED: { variant: 'success', label: 'Completed' },
    PENDING: { variant: 'warning', label: 'Pending' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

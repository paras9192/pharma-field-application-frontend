import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { dailyReportsApi } from '@/api/dailyReports';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { DailyReport, ReportStatus } from '@/types/api';
import dayjs from 'dayjs';

export default function DailyReportsPage() {
  const [page, setPage] = useState(1);

  const todayQuery = useQuery({
    queryKey: ['daily-reports', 'today'],
    queryFn: () => dailyReportsApi.today(),
    select: r => r.data.data,
  });

  const listQuery = useQuery({
    queryKey: ['daily-reports', 'list', page],
    queryFn: () => dailyReportsApi.list({ page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  const todayReport = todayQuery.data;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Daily Reports</h2>
      </div>

      {/* Today's report */}
      <Card className={todayReport ? (todayReport.status === 'SUBMITTED' ? 'border-green-200' : 'border-amber-200') : 'border-dashed border-slate-300'}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Today — {dayjs().format('MMMM D, YYYY')}</div>
            {todayReport ? (
              <div>
                <div className="font-semibold text-slate-800">
                  {todayReport.totalVisits} visits · {todayReport.doctorVisits}D / {todayReport.chemistVisits}C
                </div>
                <div className="mt-1">
                  <ReportStatusBadge status={todayReport.status} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No report created yet</div>
            )}
          </div>
          {todayReport ? (
            <Link to={`/daily-reports/${todayReport.id}`}>
              <Button variant="outline" size="sm">View</Button>
            </Link>
          ) : (
            <Link to="/daily-reports/new">
              <Button size="sm"><Plus size={14} /> Create</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* History */}
      <div>
        <h3 className="font-semibold text-slate-600 mb-3 text-sm">History</h3>
        {listQuery.isLoading ? (
          <ListSkeleton />
        ) : listQuery.isError ? (
          <ErrorMessage onRetry={listQuery.refetch} />
        ) : !listQuery.data?.data?.length ? (
          <EmptyState icon={<FileText size={40} />} title="No reports yet" />
        ) : (
          <>
            <div className="space-y-3">
              {listQuery.data.data.map(r => <ReportCard key={r.id} report={r} />)}
            </div>
            {listQuery.data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-3">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-slate-500">{page}/{listQuery.data.meta.totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === listQuery.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: DailyReport }) {
  return (
    <Link to={`/daily-reports/${report.id}`}>
      <Card className="hover:border-blue-200 transition-colors active:scale-[0.99]">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-slate-800">{dayjs(report.date).format('MMMM D, YYYY')}</div>
            <div className="text-sm text-slate-500 mt-0.5">
              {report.totalVisits} visits · {report.doctorVisits}D / {report.chemistVisits}C
            </div>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>
        {report.highlights && (
          <div className="text-xs text-slate-400 mt-2 line-clamp-1">{report.highlights}</div>
        )}
      </Card>
    </Link>
  );
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return status === 'SUBMITTED' ? (
    <Badge variant="success"><CheckCircle size={11} className="mr-1" /> Submitted</Badge>
  ) : (
    <Badge variant="warning"><Clock size={11} className="mr-1" /> Draft</Badge>
  );
}

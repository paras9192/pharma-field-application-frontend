import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Send, Edit2, CheckCircle, Save } from 'lucide-react';
import { dailyReportsApi } from '@/api/dailyReports';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Textarea } from '@/components/common/Textarea';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { ReportStatus } from '@/types/api';

export default function DailyReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const query = useQuery({
    queryKey: ['daily-report', id],
    queryFn: () => dailyReportsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const { register, handleSubmit } = useForm({
    values: {
      productsDiscussed: query.data?.productsDiscussed ?? '',
      competitorActivity: query.data?.competitorActivity ?? '',
      highlights: query.data?.highlights ?? '',
      challenges: query.data?.challenges ?? '',
      remarks: query.data?.remarks ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      dailyReportsApi.update(id!, {
        productsDiscussed: data.productsDiscussed || undefined,
        competitorActivity: data.competitorActivity || undefined,
        highlights: data.highlights || undefined,
        challenges: data.challenges || undefined,
        remarks: data.remarks || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-report', id] });
      toast.success('Report saved!');
      setEditing(false);
    },
    onError: () => toast.error('Failed to save'),
  });

  const submitMutation = useMutation({
    mutationFn: () => dailyReportsApi.submit(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-report', id] });
      qc.invalidateQueries({ queryKey: ['daily-reports'] });
      toast.success('Report submitted!');
      navigate('/daily-reports');
    },
    onError: () => toast.error('Failed to submit'),
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const report = query.data;
  if (!report) return null;

  const isSubmitted = report.status === 'SUBMITTED';

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold text-slate-800">{dayjs(report.date).format('MMMM D, YYYY')}</div>
            <div className="text-sm text-slate-500">Report by {report.user.name}</div>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{report.totalVisits}</div>
            <div className="text-xs text-blue-500">Total</div>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-teal-700">{report.doctorVisits}</div>
            <div className="text-xs text-teal-500">Doctors</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{report.chemistVisits}</div>
            <div className="text-xs text-purple-500">Chemists</div>
          </div>
        </div>

        {/* Actions */}
        {!isSubmitted && (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" fullWidth onClick={() => setEditing(e => !e)}>
              <Edit2 size={14} /> {editing ? 'Cancel Edit' : 'Edit'}
            </Button>
            <Button size="sm" fullWidth loading={submitMutation.isPending}
              onClick={() => { if (confirm('Submit this report? It cannot be edited after submission.')) submitMutation.mutate(); }}>
              <Send size={14} /> Submit
            </Button>
          </div>
        )}
        {isSubmitted && report.submittedAt && (
          <div className="text-xs text-green-600 mt-3 flex items-center gap-1">
            <CheckCircle size={13} /> Submitted {dayjs(report.submittedAt).format('MMM D, h:mm A')}
          </div>
        )}
      </Card>

      {/* Content */}
      {editing ? (
        <form onSubmit={handleSubmit(data => updateMutation.mutate(data))} className="space-y-4">
          <Card>
            <div className="space-y-4">
              <Textarea label="Products Discussed" placeholder="Products discussed during visits..." {...register('productsDiscussed')} />
              <Textarea label="Highlights" placeholder="Key highlights of the day..." {...register('highlights')} />
              <Textarea label="Challenges" placeholder="Challenges faced..." {...register('challenges')} />
              <Textarea label="Competitor Activity" placeholder="Competitor observations..." {...register('competitorActivity')} />
              <Textarea label="Remarks" placeholder="Additional remarks..." {...register('remarks')} />
            </div>
          </Card>
          <Button type="submit" fullWidth loading={updateMutation.isPending}>
            <Save size={14} /> Save Report
          </Button>
        </form>
      ) : (
        <Card>
          <div className="space-y-4">
            {report.productsDiscussed && <Field label="Products Discussed" value={report.productsDiscussed} />}
            {report.highlights && <Field label="Highlights" value={report.highlights} />}
            {report.challenges && <Field label="Challenges" value={report.challenges} />}
            {report.competitorActivity && <Field label="Competitor Activity" value={report.competitorActivity} />}
            {report.remarks && <Field label="Remarks" value={report.remarks} />}
            {!report.productsDiscussed && !report.highlights && !report.challenges && !report.competitorActivity && !report.remarks && (
              <div className="text-sm text-slate-400 text-center py-4">No content added yet</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm text-slate-700 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return status === 'SUBMITTED' ? (
    <Badge variant="success"><CheckCircle size={11} className="mr-1" /> Submitted</Badge>
  ) : (
    <Badge variant="warning">Draft</Badge>
  );
}

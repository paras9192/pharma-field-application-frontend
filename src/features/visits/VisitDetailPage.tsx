import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, MapPin, Clock, Package, CheckCircle, Stethoscope, ShoppingBag } from 'lucide-react';
import { visitsApi } from '@/api/visits';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { VisitStatus } from '@/types/api';

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const followUpMutation = useMutation({
    mutationFn: () => visitsApi.markFollowUpDone(id!),
    onSuccess: () => {
      toast.success('Follow-up marked as done!');
      qc.invalidateQueries({ queryKey: ['visit', id] });
      qc.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const v = query.data;
  if (!v) return null;

  const isDoctor = v.visitType === 'DOCTOR';
  const entityName = isDoctor ? v.doctor?.name : v.chemist?.shopName;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDoctor ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {isDoctor ? <Stethoscope size={22} className="text-blue-600" /> : <ShoppingBag size={22} className="text-purple-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800 text-lg truncate">{entityName}</div>
            {isDoctor && v.doctor?.specialization && (
              <div className="text-sm text-blue-600">{v.doctor.specialization}</div>
            )}
            {!isDoctor && v.chemist?.ownerName && (
              <div className="text-sm text-slate-500">{v.chemist.ownerName}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <VisitStatusBadge status={v.status} />
              <span className="text-xs text-slate-400">{dayjs(v.visitDate).format('MMMM D, YYYY')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link to={`/visits/${id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth><Edit2 size={14} /> Edit</Button>
          </Link>
        </div>
      </Card>

      {/* Visit Info */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Visit Details</h3>
        <div className="space-y-2.5">
          {v.purpose && <InfoRow label="Purpose" value={v.purpose} />}
          {v.notes && <InfoRow label="Notes" value={v.notes} />}
          {v.territory && <InfoRow icon={<MapPin size={14} />} label="Territory" value={v.territory.name} />}
          {v.locationAddress && <InfoRow icon={<MapPin size={14} />} label="Location" value={v.locationAddress} />}
          <InfoRow icon={<Clock size={14} />} label="Visit Time" value={dayjs(v.visitTime).format('h:mm A')} />
          <InfoRow label="Reported by" value={v.user.name} />
        </div>
      </Card>

      {/* Products */}
      {v.products?.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package size={15} /> Products Discussed
          </h3>
          <div className="space-y-2">
            {v.products.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-xl p-3">
                <div className="font-medium text-slate-800">{p.productName}</div>
                {p.details && <div className="text-xs text-slate-500 mt-0.5">{p.details}</div>}
                {p.quantity && <div className="text-xs text-blue-600">Qty: {p.quantity}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Follow-up */}
      {v.followUpDate && (
        <Card className={v.followUpDone ? 'border-green-200' : dayjs(v.followUpDate).isBefore(dayjs()) ? 'border-red-200' : 'border-amber-200'}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={15} className="text-amber-500" /> Follow-up
              </h3>
              <div className="text-sm text-slate-600 mt-1">{dayjs(v.followUpDate).format('MMMM D, YYYY')}</div>
              {v.followUpNotes && <div className="text-xs text-slate-400 mt-0.5">{v.followUpNotes}</div>}
            </div>
            {v.followUpDone ? (
              <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Done</Badge>
            ) : (
              <Button size="sm" variant="outline" loading={followUpMutation.isPending} onClick={() => followUpMutation.mutate()}>
                Mark Done
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
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

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>}
      <div className={icon ? '' : 'pl-0'}>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

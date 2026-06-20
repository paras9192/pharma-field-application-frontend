import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Phone, Mail, MapPin, Building2, Trash2, Plus } from 'lucide-react';
import { doctorsApi } from '@/api/doctors';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => doctorsApi.delete(id!),
    onSuccess: () => {
      toast.success('Doctor deactivated');
      qc.invalidateQueries({ queryKey: ['doctors'] });
      navigate('/doctors');
    },
    onError: () => toast.error('Failed to deactivate'),
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const doc = query.data;
  if (!doc) return null;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-xl">{doc.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{doc.name}</h2>
              {!doc.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            {doc.specialization && (
              <div className="text-blue-600 font-medium mt-0.5">{doc.specialization}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Added {dayjs(doc.createdAt).format('MMM D, YYYY')}</div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link to={`/doctors/${id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              <Edit2 size={14} /> Edit
            </Button>
          </Link>
          <Link to={`/visits/new?doctorId=${id}&doctorName=${encodeURIComponent(doc.name)}`} className="flex-1">
            <Button size="sm" fullWidth>
              <Plus size={14} /> Log Visit
            </Button>
          </Link>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Deactivate this doctor?')) deleteMutation.mutate();
              }}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </Card>

      {/* Contact Info */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Contact & Location</h3>
        <div className="space-y-2.5">
          {doc.clinicName && <InfoRow icon={<Building2 size={15} />} label="Clinic" value={doc.clinicName} />}
          {doc.hospitalName && <InfoRow icon={<Building2 size={15} />} label="Hospital" value={doc.hospitalName} />}
          {doc.phone && <InfoRow icon={<Phone size={15} />} label="Phone" value={doc.phone} />}
          {doc.alternatePhone && <InfoRow icon={<Phone size={15} />} label="Alt Phone" value={doc.alternatePhone} />}
          {doc.email && <InfoRow icon={<Mail size={15} />} label="Email" value={doc.email} />}
          {doc.address && <InfoRow icon={<MapPin size={15} />} label="Address" value={doc.address} />}
          {doc.territory && <InfoRow icon={<MapPin size={15} />} label="Territory" value={doc.territory.name} />}
        </div>
      </Card>

      {/* Added by */}
      {doc.addedBy && (
        <Card>
          <div className="text-xs text-slate-400">
            Added by <span className="font-medium text-slate-600">{doc.addedBy.name}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

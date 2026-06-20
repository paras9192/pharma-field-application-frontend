import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Phone, Mail, MapPin, Hash, Trash2, Plus } from 'lucide-react';
import { chemistsApi } from '@/api/chemists';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function ChemistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['chemist', id],
    queryFn: () => chemistsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => chemistsApi.delete(id!),
    onSuccess: () => {
      toast.success('Chemist deactivated');
      qc.invalidateQueries({ queryKey: ['chemists'] });
      navigate('/chemists');
    },
    onError: () => toast.error('Failed to deactivate'),
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const c = query.data;
  if (!c) return null;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 font-bold text-xl">{c.shopName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{c.shopName}</h2>
              {!c.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            <div className="text-slate-500 mt-0.5">{c.ownerName}</div>
            <div className="text-xs text-slate-400 mt-1">Added {dayjs(c.createdAt).format('MMM D, YYYY')}</div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link to={`/chemists/${id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth><Edit2 size={14} /> Edit</Button>
          </Link>
          <Link to={`/visits/new?chemistId=${id}&chemistName=${encodeURIComponent(c.shopName)}`} className="flex-1">
            <Button size="sm" fullWidth><Plus size={14} /> Log Visit</Button>
          </Link>
          {isAdmin && (
            <Button variant="danger" size="sm" loading={deleteMutation.isPending}
              onClick={() => { if (confirm('Deactivate this chemist?')) deleteMutation.mutate(); }}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Contact & Details</h3>
        <div className="space-y-2.5">
          <InfoRow icon={<Phone size={15} />} label="Phone" value={c.phone} />
          {c.alternatePhone && <InfoRow icon={<Phone size={15} />} label="Alt Phone" value={c.alternatePhone} />}
          {c.email && <InfoRow icon={<Mail size={15} />} label="Email" value={c.email} />}
          {c.gstNumber && <InfoRow icon={<Hash size={15} />} label="GST" value={c.gstNumber} />}
          {c.address && <InfoRow icon={<MapPin size={15} />} label="Address" value={c.address} />}
          {c.territory && <InfoRow icon={<MapPin size={15} />} label="Territory" value={c.territory.name} />}
        </div>
      </Card>

      {c.addedBy && (
        <Card padding="sm">
          <div className="text-xs text-slate-400">
            Added by <span className="font-medium text-slate-600">{c.addedBy.name}</span>
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

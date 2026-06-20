import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Edit2, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { usersApi } from '@/api/users';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import dayjs from 'dayjs';
import type { Role } from '@/types/api';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const territoriesQuery = useQuery({
    queryKey: ['user-territories', id],
    queryFn: () => import('@/api/territories').then(m => m.territoriesApi.getUserTerritories(id!)),
    select: r => r.data.data,
    enabled: !!id,
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const user = query.data;
  if (!user) return null;

  const roleColors: Record<Role, string> = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'info',
    MR: 'success',
    SALES_PERSON: 'warning',
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <Card>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${user.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              {!user.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            <Badge variant={roleColors[user.role.name] as 'purple' | 'info' | 'success' | 'warning'} size="md">
              {user.role.name.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <Link to={`/users/${id}/edit`} className="block mt-4">
          <Button variant="outline" size="sm" fullWidth><Edit2 size={14} /> Edit Profile</Button>
        </Link>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Contact</h3>
        <div className="space-y-2.5">
          <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} />
          <InfoRow icon={<Phone size={14} />} label="Phone" value={user.phone} />
          {user.employeeCode && <InfoRow icon={<span className="text-xs font-bold">#</span>} label="Employee Code" value={user.employeeCode} />}
          {user.dateOfJoining && <InfoRow icon={<Calendar size={14} />} label="Joined" value={dayjs(user.dateOfJoining).format('MMMM D, YYYY')} />}
        </div>
      </Card>

      {/* Territories */}
      {territoriesQuery.data && territoriesQuery.data.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={15} /> Assigned Territories ({territoriesQuery.data.length})
          </h3>
          <div className="space-y-2">
            {territoriesQuery.data.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-slate-800">{t.name}</div>
                  {t.code && <div className="text-xs text-slate-400">{t.code}</div>}
                </div>
                <Badge variant={t.isActive ? 'success' : 'danger'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}
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

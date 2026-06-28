import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, UserCheck, UserX, Shield } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { User, Role } from '@/types/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const currentUserRole = useAuthStore(s => s.user?.role);
  const canToggleActive = currentUserRole === 'SUPER_ADMIN';

  const query = useQuery({
    queryKey: ['users', { search, roleFilter, page }],
    queryFn: () => usersApi.list({ search: search || undefined, role: roleFilter || undefined, page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: usersApi.toggleActive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team</h2>
          {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} employees</p>}
        </div>
        <Link to="/users/new">
          <Button size="sm"><Plus size={16} /> Add</Button>
        </Link>
      </div>

      <Input
        placeholder="Search by name, email, phone..."
        leftIcon={<Search size={16} />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
      />

      <Select
        options={[
          { value: 'SUPER_ADMIN', label: 'Super Admin' },
          { value: 'ADMIN', label: 'Admin' },
          { value: 'MR', label: 'MR' },
          { value: 'SALES_PERSON', label: 'Sales Person' },
        ]}
        placeholder="All roles"
        value={roleFilter}
        onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
      />

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState
          icon={<Shield size={40} />}
          title="No users found"
          action={<Link to="/users/new"><Button size="sm">Add User</Button></Link>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onToggle={() => toggleMutation.mutate(user.id)}
                toggling={toggleMutation.isPending}
                canToggle={canToggleActive}
              />
            ))}
          </div>
          {query.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page}/{query.data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === query.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserCard({ user, onToggle, toggling, canToggle }: { user: User; onToggle: () => void; toggling: boolean; canToggle: boolean }) {
  const roleColors: Record<Role, string> = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'info',
    MR: 'success',
    SALES_PERSON: 'warning',
  };

  return (
    <Card hover className="hover:border-blue-200">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 ${user.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
          {user.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <Link to={`/users/${user.id}`} className="font-semibold text-slate-800 hover:text-blue-600">{user.name}</Link>
            <Badge variant={roleColors[user.role.name] as 'purple' | 'info' | 'success' | 'warning'}>
              {user.role.name.replace('_', ' ')}
            </Badge>
            {!user.isActive && <Badge variant="danger">Inactive</Badge>}
          </div>
          <div className="text-sm text-slate-500">{user.email}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            {user.employeeCode && <span>{user.employeeCode}</span>}
            {user.phone && <span>{user.phone}</span>}
            {user.dateOfJoining && <span>Joined {dayjs(user.dateOfJoining).format('MMM YYYY')}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Link to={`/users/${user.id}/edit`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
          {canToggle && (
            <Button
              variant="ghost"
              size="sm"
              loading={toggling}
              onClick={onToggle}
              className={user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
            >
              {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

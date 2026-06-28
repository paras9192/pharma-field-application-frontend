import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Mail, Phone, Calendar, MapPin, KeyRound, ShoppingBag, Plus, X, Search, Send } from 'lucide-react';
import { usersApi } from '@/api/users';
import { chemistsApi } from '@/api/chemists';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { Role, Chemist } from '@/types/api';

const FIELD_ROLES: Role[] = ['SALES_PERSON'];

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const currentUserRole = useAuthStore(s => s.user?.role);
  const qc = useQueryClient();

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

  const assignedChemistsQuery = useQuery({
    queryKey: ['user-assigned-chemists', id],
    queryFn: () => usersApi.getAssignedChemists(id!),
    select: r => r.data.data,
    enabled: !!id && FIELD_ROLES.includes(query.data?.role?.name as Role),
  });

  const sendResetLinkMutation = useMutation({
    mutationFn: () => usersApi.sendResetLink(id!),
    onSuccess: (res) => toast.success(res.data.data.message),
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to send reset link');
    },
  });

  const removeChemistMutation = useMutation({
    mutationFn: (chemistId: string) => usersApi.removeAssignedChemist(id!, chemistId),
    onSuccess: () => {
      toast.success('Chemist removed');
      qc.invalidateQueries({ queryKey: ['user-assigned-chemists', id] });
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to remove chemist');
    },
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const user = query.data;
  if (!user) return null;

  const isFieldUser = FIELD_ROLES.includes(user.role.name as Role);

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
          <Avatar
            name={user.name}
            src={user.profilePhoto}
            className="w-16 h-16 rounded-2xl text-xl flex-shrink-0"
            fallbackClassName={user.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
          />
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
        <div className="flex gap-2 mt-4">
          <Link to={`/users/${id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth><Edit2 size={14} /> Edit Profile</Button>
          </Link>
          {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && user.role.name !== 'SUPER_ADMIN')) && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowResetModal(true)}>
                <KeyRound size={14} /> Reset Password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                loading={sendResetLinkMutation.isPending}
                onClick={() => sendResetLinkMutation.mutate()}
              >
                <Send size={14} /> Send Reset Link
              </Button>
            </>
          )}
        </div>
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

      {/* Assigned Chemists — field users only */}
      {isFieldUser && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <ShoppingBag size={15} /> Assigned Parties
              {assignedChemistsQuery.data && ` (${assignedChemistsQuery.data.length})`}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAssignModal(true)}>
              <Plus size={13} /> Assign
            </Button>
          </div>

          {assignedChemistsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : assignedChemistsQuery.data?.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              No chemists assigned yet.{' '}
              <button className="text-blue-500 hover:underline" onClick={() => setShowAssignModal(true)}>Assign now</button>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedChemistsQuery.data?.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.chemist.shopName}</div>
                    <div className="text-xs text-slate-400">{c.chemist.ownerName}{c.chemist.territory && ` · ${c.chemist.territory.name}`}</div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Remove ${c.chemist.shopName}?`)) removeChemistMutation.mutate(c.chemist.id); }}
                    className="p-1.5 ml-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <ResetPasswordModal
        open={showResetModal}
        userId={id!}
        userName={user.name}
        onClose={() => setShowResetModal(false)}
      />

      {isFieldUser && (
        <AssignChemistsModal
          open={showAssignModal}
          salesPersonId={id!}
          alreadyAssigned={(assignedChemistsQuery.data ?? []).map(c => c.chemist as Chemist)}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['user-assigned-chemists', id] });
            setShowAssignModal(false);
          }}
        />
      )}
    </div>
  );
}

function AssignChemistsModal({
  open, salesPersonId, alreadyAssigned, onClose, onSuccess,
}: {
  open: boolean;
  salesPersonId: string;
  alreadyAssigned: Chemist[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const chemistsQuery = useQuery({
    queryKey: ['chemists-all', search],
    queryFn: () => chemistsApi.list({ search: search || undefined, limit: 100 }),
    select: r => r.data.data,
    enabled: open,
  });

  const assignedIds = new Set(alreadyAssigned.map(c => c.id));
  const available = (chemistsQuery.data ?? []).filter(c => !assignedIds.has(c.id));

  const mutation = useMutation({
    mutationFn: () => usersApi.assignChemists(salesPersonId, Array.from(selected)),
    onSuccess: () => {
      toast.success(`${selected.size} chemist${selected.size > 1 ? 's' : ''} assigned`);
      setSelected(new Set());
      setSearch('');
      onSuccess();
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign');
    },
  });

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleClose = () => { setSelected(new Set()); setSearch(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Assign Chemists">
      <div className="space-y-3">
        <Input
          placeholder="Search chemists..."
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {chemistsQuery.isLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading...</div>
          ) : available.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              {search ? 'No results' : 'All chemists already assigned'}
            </div>
          ) : (
            available.map(c => {
              const checked = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    checked ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  }`}>
                    {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white fill-current"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{c.shopName}</div>
                    <div className="text-xs text-slate-400">{c.ownerName}{c.territory && ` · ${c.territory.name}`}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected.size > 0 && (
          <div className="text-xs text-blue-600 font-medium">{selected.size} selected</div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={handleClose}>Cancel</Button>
          <Button fullWidth disabled={selected.size === 0} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Assign {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
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

function ResetPasswordModal({ open, userId, userName, onClose }: { open: boolean; userId: string; userName: string; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => usersApi.resetPassword(userId, password),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setPassword('');
      setError('');
      onClose();
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = err.response?.data?.error?.message || 'Failed to reset password';
      if (err.response?.status === 403) {
        toast.error(msg);
        onClose();
      } else {
        setError(msg);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8 || password.length > 64) {
      setError('Password must be 8–64 characters');
      return;
    }
    setError('');
    mutation.mutate();
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Reset Password — ${userName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">Set a new password for this user. They will need to use it on their next login.</p>
        <Input
          label="New Password"
          type="password"
          required
          placeholder="Min 8 chars"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={error}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={handleClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={mutation.isPending}>Reset Password</Button>
        </div>
      </form>
    </Modal>
  );
}

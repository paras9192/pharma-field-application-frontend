import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Phone, Mail, MapPin, Hash, Trash2, Plus, UserPlus, Search } from 'lucide-react';
import { chemistsApi } from '@/api/chemists';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import dayjs from 'dayjs';

export default function ChemistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);

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
            <>
              <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
                <UserPlus size={14} />
              </Button>
              <Button variant="danger" size="sm" loading={deleteMutation.isPending}
                onClick={() => { if (confirm('Deactivate this chemist?')) deleteMutation.mutate(); }}>
                <Trash2 size={14} />
              </Button>
            </>
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

      {isAdmin && (
        <AssignToRepModal
          open={showAssignModal}
          chemistId={id!}
          chemistName={c.shopName}
          currentAssignee={c.assignedSalesPerson}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}

function AssignToRepModal({
  open, chemistId, chemistName, currentAssignee, onClose,
}: {
  open: boolean;
  chemistId: string;
  chemistName: string;
  currentAssignee: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(currentAssignee?.id ?? '');

  // Sync pre-selection each time the modal opens
  useEffect(() => {
    if (open) setSelectedUserId(currentAssignee?.id ?? '');
  }, [open, currentAssignee?.id]);

  const usersQuery = useQuery({
    queryKey: ['sales-persons', search],
    queryFn: () => usersApi.list({ role: 'SALES_PERSON', search: search || undefined, limit: 100 }),
    select: r => r.data.data,
    enabled: open,
  });

  const allReps = usersQuery.data ?? [];

  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => usersApi.assignChemists(selectedUserId, [chemistId]),
    onSuccess: () => {
      toast.success(currentAssignee ? 'Reassigned successfully' : 'Assigned successfully');
      qc.invalidateQueries({ queryKey: ['chemist', chemistId] });
      setSearch('');
      onClose();
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to assign');
    },
  });

  const handleClose = () => { setSearch(''); setSelectedUserId(currentAssignee?.id ?? ''); onClose(); };

  const isUnchanged = selectedUserId === (currentAssignee?.id ?? '');

  return (
    <Modal open={open} onClose={handleClose} title={`Assign "${chemistName}" to Rep`}>
      <div className="space-y-3">
        {currentAssignee ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {currentAssignee.name[0].toUpperCase()}
            </div>
            <div className="text-sm text-amber-800">
              Currently assigned to <span className="font-semibold">{currentAssignee.name}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select a sales person to give them access to this chemist.</p>
        )}

        <Input
          placeholder="Search by name..."
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {usersQuery.isLoading ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading...</div>
          ) : allReps.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No sales persons found</div>
          ) : (
            allReps.map(u => {
              const isCurrent = u.id === currentAssignee?.id;
              const isSelected = u.id === selectedUserId;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-400">SALES PERSON{u.employeeCode && ` · ${u.employeeCode}`}</div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                      Current
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={handleClose}>Cancel</Button>
          <Button
            fullWidth
            disabled={!selectedUserId || isUnchanged}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {currentAssignee ? 'Reassign' : 'Assign'}
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

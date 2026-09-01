import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { Plus, Search, ShoppingBag, Phone, MapPin, User, Bell, X } from 'lucide-react';
import { chemistsApi } from '@/api/chemists';
import { billsApi } from '@/api/bills';
import { canCreateChemist } from '@/utils/permissions';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import type { Chemist } from '@/types/api';
import { chemistLocality, chemistPhone, chemistSubtitle } from './chemistMeta';

type StatusFilter = 'active' | 'all' | 'inactive';

const LIMIT = 20;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'all', label: 'All' },
];

export default function ChemistsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [page, setPage] = useState(1);
  const currentRole = useAuthStore(s => s.user?.role);
  const isAdmin = useAuthStore(s => s.isAdmin());
  const canCreate = !!currentRole && canCreateChemist(currentRole);

  const search = useDebouncedValue(searchInput.trim(), 350);

  const query = useQuery({
    queryKey: ['chemists', { search, status, page }],
    queryFn: () => chemistsApi.list({
      search: search || undefined,
      isActive: status === 'all' ? undefined : status === 'active' ? 'true' : 'false',
      page,
      limit: LIMIT,
    }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  // Outstanding-due lookup, admin-only — skip the 500-row bills fetch for reps.
  const billsQuery = useQuery({
    queryKey: ['bills-due-map'],
    queryFn: () => billsApi.list({ limit: 500 }),
    enabled: isAdmin,
    select: r => {
      const map: Record<string, number> = {};
      for (const bill of r.data.data) {
        if (bill.status !== 'PAID' && bill.dueAmount > 0) {
          map[bill.chemistId] = (map[bill.chemistId] ?? 0) + Number(bill.dueAmount);
        }
      }
      return map;
    },
  });

  const dueMap = billsQuery.data ?? {};
  const meta = query.data?.meta;
  const rows = query.data?.data ?? [];
  const rangeStart = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? rangeStart + rows.length - 1 : 0;

  const resetPage = () => setPage(1);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Chemists</h2>
          {meta && (
            <p className="text-sm text-slate-400">
              {rows.length > 0
                ? <>Showing {rangeStart.toLocaleString('en-IN')}–{rangeEnd.toLocaleString('en-IN')} of {meta.total.toLocaleString('en-IN')}</>
                : <>{meta.total.toLocaleString('en-IN')} total</>}
            </p>
          )}
        </div>
        {canCreate && (
          <Link to="/chemists/new">
            <Button size="sm"><Plus size={16} /> Add</Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Search by shop, owner, phone, Marg code…"
        leftIcon={<Search size={16} />}
        value={searchInput}
        onChange={e => { setSearchInput(e.target.value); resetPage(); }}
        rightIcon={
          searchInput
            ? <button type="button" onClick={() => { setSearchInput(''); resetPage(); }} aria-label="Clear search"><X size={15} /></button>
            : undefined
        }
      />

      <div className="flex gap-1.5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); resetPage(); }}
            className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors ${
              status === tab.key
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !rows.length ? (
        <EmptyState
          icon={<ShoppingBag size={40} />}
          title="No chemists found"
          description={search ? `Nothing matches “${search}”` : 'Add your first chemist'}
          action={!search && canCreate ? <Link to="/chemists/new"><Button size="sm">Add Chemist</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {rows.map(c => <ChemistCard key={c.id} chemist={c} dueAmount={dueMap[c.id] ?? 0} isAdmin={isAdmin} />)}
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChemistCard({ chemist, dueAmount, isAdmin }: { chemist: Chemist; dueAmount: number; isAdmin: boolean }) {
  const reminderMutation = useMutation({
    mutationFn: () => chemistsApi.sendReminder(chemist.id),
    onSuccess: (res) => toast.success(res.data.data.message),
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to send reminder');
    },
  });

  const handleRemind = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reminderMutation.mutate();
  };

  const subtitle = chemistSubtitle(chemist);
  const phone = chemistPhone(chemist);
  const locality = chemistLocality(chemist);

  return (
    <Link to={`/chemists/${chemist.id}`}>
      <Card hover className="hover:border-purple-200 active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-800 truncate">{chemist.shopName}</div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!chemist.isActive && <Badge variant="danger">Inactive</Badge>}
                {isAdmin && dueAmount > 0 && (
                  <button
                    onClick={handleRemind}
                    disabled={reminderMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <Bell size={11} /> {reminderMutation.isPending ? '…' : 'Remind'}
                  </button>
                )}
              </div>
            </div>

            {subtitle && <div className="text-sm text-slate-500 truncate">{subtitle}</div>}

            <div className="flex items-center gap-x-3 gap-y-0.5 mt-1 flex-wrap">
              {chemist.margCode && (
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                  {chemist.margCode}
                </span>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-slate-400 flex items-center gap-1 hover:text-purple-600"
                >
                  <Phone size={11} /> {phone}
                </a>
              )}
              {locality && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {locality}
                </span>
              )}
              {isAdmin && dueAmount > 0 && (
                <span className="text-xs font-semibold text-red-500">
                  Due ₹{dueAmount.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {chemist.assignedSalesPerson && (
              <div className="flex items-center gap-1 mt-1.5">
                <User size={11} className="text-blue-400" />
                <span className="text-xs text-blue-500 font-medium">{chemist.assignedSalesPerson.name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

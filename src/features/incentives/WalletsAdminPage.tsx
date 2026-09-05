import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Search, ArrowRight } from 'lucide-react';
import { incentivesApi } from '@/api/incentives';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { ROLE_BADGE_VARIANTS, ROLE_FILTER_OPTIONS, ROLE_SHORT_LABELS } from '@/utils/roles';
import type { WalletSummary, Role } from '@/types/api';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WalletsAdminPage() {
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchInput.trim(), 350);

  const query = useQuery({
    queryKey: ['incentive-wallets', { search, roleFilter, page }],
    queryFn: () => incentivesApi.getAllWallets({
      search: search || undefined,
      role: (roleFilter || undefined) as Role | undefined,
      page,
      limit: 20,
    }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  const totalOutstanding = query.data?.data.reduce((sum, w) => sum + w.availableBalance, 0) ?? 0;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet size={22} className="text-blue-600" /> Incentive Wallets
        </h2>
        {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} employees</p>}
      </div>

      {query.data && query.data.data.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-50/40 border-emerald-100">
          <div className="text-xs text-emerald-700 font-medium">Outstanding on this page</div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{fmt(totalOutstanding)}</div>
        </Card>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by name, employee code, email..."
            leftIcon={<Search size={16} />}
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-40">
          <Select
            options={ROLE_FILTER_OPTIONS}
            placeholder="All roles"
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState icon={<Wallet size={40} />} title="No wallets found" description="Try different filters" />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(w => <WalletRow key={w.id} wallet={w} />)}
          </div>
          {query.data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">{page} / {query.data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === query.data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WalletRow({ wallet }: { wallet: WalletSummary }) {
  const employeeId = wallet.userId ?? wallet.id;
  return (
    <Link to={employeeId ? `/wallet/${employeeId}` : '#'}>
      <Card hover className="hover:border-blue-200 active:scale-[0.99]">
        <div className="flex items-center gap-3">
          <Avatar
            name={wallet.name}
            className="w-10 h-10 rounded-xl text-sm flex-shrink-0"
            fallbackClassName="bg-blue-100 text-blue-600"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 truncate">{wallet.name}</span>
              <Badge variant={ROLE_BADGE_VARIANTS[wallet.role]}>{ROLE_SHORT_LABELS[wallet.role]}</Badge>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {wallet.employeeCode && <span>{wallet.employeeCode} · </span>}
              {wallet.totalTransactions} txn{wallet.totalTransactions === 1 ? '' : 's'}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-sm font-bold ${wallet.availableBalance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {fmt(wallet.availableBalance)}
            </div>
            <div className="text-[11px] text-slate-400">available</div>
          </div>
          <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

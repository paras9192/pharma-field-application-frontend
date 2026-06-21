import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, ShoppingBag, Phone, MapPin, User } from 'lucide-react';
import { chemistsApi } from '@/api/chemists';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Chemist } from '@/types/api';

export default function ChemistsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['chemists', { search, page }],
    queryFn: () => chemistsApi.list({ search: search || undefined, page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Chemists</h2>
          {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} total</p>}
        </div>
        <Link to="/chemists/new">
          <Button size="sm"><Plus size={16} /> Add</Button>
        </Link>
      </div>

      <Input
        placeholder="Search by shop, owner, phone..."
        leftIcon={<Search size={16} />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
      />

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState
          icon={<ShoppingBag size={40} />}
          title="No chemists found"
          description={search ? 'Try a different search' : 'Add your first chemist'}
          action={!search ? <Link to="/chemists/new"><Button size="sm">Add Chemist</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(c => <ChemistCard key={c.id} chemist={c} />)}
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

function ChemistCard({ chemist }: { chemist: Chemist }) {
  return (
    <Link to={`/chemists/${chemist.id}`}>
      <Card className="hover:border-purple-200 transition-colors active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-800 truncate">{chemist.shopName}</div>
              {!chemist.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            <div className="text-sm text-slate-500">{chemist.ownerName}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Phone size={11} /> {chemist.phone}
              </span>
              {chemist.territory && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {chemist.territory.name}
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

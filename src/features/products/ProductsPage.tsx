import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Pill, Package, AlertTriangle } from 'lucide-react';
import { productsApi } from '@/api/products';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/utils/permissions';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { dosageFormLabel, formatMoney, isLowStock } from './productMeta';
import type { Product } from '@/types/api';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const role = useAuthStore(s => s.user?.role);
  const canManage = !!role && canManageProducts(role);

  const query = useQuery({
    queryKey: ['products', { search, page, lowStockOnly }],
    queryFn: () => productsApi.list({
      search: search || undefined,
      page,
      limit: 20,
      isActive: 'true',
      lowStock: lowStockOnly ? 'true' : undefined,
    }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Products</h2>
          {query.data && <p className="text-sm text-slate-400">{query.data.meta.total} total</p>}
        </div>
        {canManage && (
          <Link to="/products/new">
            <Button size="sm"><Plus size={16} /> Add</Button>
          </Link>
        )}
      </div>

      <Input
        placeholder="Search by name, code, composition..."
        leftIcon={<Search size={16} />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
      />

      <div className="flex gap-2">
        <button
          onClick={() => { setLowStockOnly(v => !v); setPage(1); }}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors ${
            lowStockOnly
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={13} /> Low stock only
        </button>
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState
          icon={<Package size={40} />}
          title="No products found"
          description={search || lowStockOnly ? 'Try a different filter' : 'Add your first product'}
          action={!search && !lowStockOnly && canManage
            ? <Link to="/products/new"><Button size="sm">Add Product</Button></Link>
            : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(p => <ProductCard key={p.id} product={p} />)}
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

function ProductCard({ product: p }: { product: Product }) {
  const low = isLowStock(p.inventory, p.reorderLevel);

  return (
    <Link to={`/products/${p.id}`}>
      <Card hover className="hover:border-blue-200 active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {p.images?.[0]
              ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
              : <Pill size={18} className="text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-800 truncate">{p.name}</div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!p.isActive && <Badge variant="danger">Inactive</Badge>}
                {low && <Badge variant="warning">Low stock</Badge>}
              </div>
            </div>
            <div className="text-xs text-slate-400 font-mono">{p.productCode}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
              {p.dosageForm && <span>{dosageFormLabel(p.dosageForm)}</span>}
              {p.packSize && <span>{p.packSize}</span>}
              <span className="font-semibold text-slate-600">{formatMoney(p.rate)}</span>
              <span className={low ? 'font-semibold text-amber-600' : ''}>Stock: {p.inventory}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

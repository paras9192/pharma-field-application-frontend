import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Stethoscope, Phone, MapPin } from 'lucide-react';
import { doctorsApi } from '@/api/doctors';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { Doctor } from '@/types/api';

export default function DoctorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['doctors', { search, page }],
    queryFn: () => doctorsApi.list({ search: search || undefined, page, limit: 20 }),
    select: r => r.data,
    placeholderData: prev => prev,
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Doctors</h2>
          {query.data && (
            <p className="text-sm text-slate-400">{query.data.meta.total} total</p>
          )}
        </div>
        <Link to="/doctors/new">
          <Button size="sm"><Plus size={16} /> Add</Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name, specialization, phone..."
        leftIcon={<Search size={16} />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
      />

      {/* List */}
      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : !query.data?.data?.length ? (
        <EmptyState
          icon={<Stethoscope size={40} />}
          title="No doctors found"
          description={search ? 'Try a different search term' : 'Add your first doctor'}
          action={!search ? <Link to="/doctors/new"><Button size="sm">Add Doctor</Button></Link> : undefined}
        />
      ) : (
        <>
          <div className="space-y-3">
            {query.data.data.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}
          </div>
          <Pagination meta={query.data.meta} page={page} onPage={setPage} />
        </>
      )}
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <Link to={`/doctors/${doctor.id}`}>
      <Card className="hover:border-blue-200 transition-colors active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Stethoscope size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-slate-800 truncate">{doctor.name}</div>
              {!doctor.isActive && <Badge variant="danger">Inactive</Badge>}
            </div>
            {doctor.specialization && (
              <div className="text-sm text-blue-600 font-medium">{doctor.specialization}</div>
            )}
            {doctor.clinicName && (
              <div className="text-xs text-slate-500 mt-0.5 truncate">{doctor.clinicName}</div>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {doctor.phone && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Phone size={11} /> {doctor.phone}
                </span>
              )}
              {doctor.territory && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {doctor.territory.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Pagination({ meta, page, onPage }: { meta: { total: number; totalPages: number; page: number }; page: number; onPage: (p: number) => void }) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="text-sm text-slate-500">{page} / {meta.totalPages}</span>
      <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

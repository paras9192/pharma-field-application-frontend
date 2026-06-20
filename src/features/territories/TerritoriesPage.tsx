import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ChevronDown, ChevronRight, MapPin, Building2, Map } from 'lucide-react';
import { territoriesApi } from '@/api/territories';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { TerritoryHierarchy } from '@/types/api';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

type ModalType = 'state' | 'district' | 'city' | 'territory' | null;

export default function TerritoriesPage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [expandedStates, setExpandedStates] = useState<Set<number>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['territories', 'hierarchy'],
    queryFn: () => territoriesApi.getHierarchy(),
    select: r => r.data.data,
  });

  const statesQuery = useQuery({
    queryKey: ['territories', 'states'],
    queryFn: () => territoriesApi.getStates(),
    select: r => r.data.data,
  });

  const districtsQuery = useQuery({
    queryKey: ['territories', 'districts'],
    queryFn: () => territoriesApi.getDistricts(),
    select: r => r.data.data,
  });

  const citiesQuery = useQuery({
    queryKey: ['territories', 'cities'],
    queryFn: () => territoriesApi.getCities(),
    select: r => r.data.data,
  });

  const toggleState = (id: number) => setExpandedStates(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const toggleDistrict = (id: number) => setExpandedDistricts(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Territories</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setModal('state')}>+ State</Button>
          <Button size="sm" onClick={() => setModal('territory')}><Plus size={14} /> Territory</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setModal('district')}>+ District</Button>
        <Button size="sm" variant="ghost" onClick={() => setModal('city')}>+ City</Button>
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <ErrorMessage onRetry={query.refetch} />
      ) : (
        <div className="space-y-2">
          {query.data?.map(state => (
            <Card key={state.id} padding="sm">
              {/* State */}
              <button
                onClick={() => toggleState(state.id)}
                className="w-full flex items-center gap-2 text-left"
              >
                {expandedStates.has(state.id) ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <Map size={15} className="text-blue-500" />
                <span className="font-semibold text-slate-800">{state.name}</span>
                <Badge variant="info">{state.code}</Badge>
                <span className="ml-auto text-xs text-slate-400">{state.districts?.length ?? 0} districts</span>
              </button>

              {expandedStates.has(state.id) && (
                <div className="ml-6 mt-2 space-y-1.5">
                  {state.districts?.map(district => (
                    <div key={district.id}>
                      <button
                        onClick={() => toggleDistrict(district.id)}
                        className="w-full flex items-center gap-2 text-left py-1 px-2 rounded-lg hover:bg-slate-50"
                      >
                        {expandedDistricts.has(district.id) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        <Building2 size={13} className="text-purple-500" />
                        <span className="text-sm font-medium text-slate-700">{district.name}</span>
                        <span className="ml-auto text-xs text-slate-400">{district.cities?.length ?? 0} cities</span>
                      </button>

                      {expandedDistricts.has(district.id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {district.cities?.map(city => (
                            <div key={city.id} className="py-1 px-2">
                              <div className="text-sm font-medium text-slate-700 mb-1">{city.name}</div>
                              <div className="ml-3 space-y-1">
                                {city.territories?.map(t => (
                                  <div key={t.id} className="flex items-center justify-between py-1 px-2 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <MapPin size={12} className="text-slate-400" />
                                      <span className="text-sm text-slate-700">{t.name}</span>
                                      {t.code && <span className="text-xs text-slate-400">{t.code}</span>}
                                    </div>
                                    <Badge variant={t.isActive ? 'success' : 'danger'}>
                                      {t.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddStateModal open={modal === 'state'} onClose={() => setModal(null)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['territories'] }); setModal(null); }} />
      <AddDistrictModal open={modal === 'district'} onClose={() => setModal(null)} states={statesQuery.data ?? []} onSuccess={() => { qc.invalidateQueries({ queryKey: ['territories'] }); setModal(null); }} />
      <AddCityModal open={modal === 'city'} onClose={() => setModal(null)} districts={districtsQuery.data ?? []} onSuccess={() => { qc.invalidateQueries({ queryKey: ['territories'] }); setModal(null); }} />
      <AddTerritoryModal open={modal === 'territory'} onClose={() => setModal(null)} cities={citiesQuery.data ?? []} onSuccess={() => { qc.invalidateQueries({ queryKey: ['territories'] }); setModal(null); }} />
    </div>
  );
}

function AddStateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const schema = z.object({ name: z.string().min(1), code: z.string().min(1) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: { name: string; code: string }) => territoriesApi.createState(data),
    onSuccess: () => { toast.success('State added!'); reset(); onSuccess(); },
    onError: (err: AxiosError<{ error: { message: string } }>) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add State">
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3">
        <Input label="State Name" required placeholder="Maharashtra" error={errors.name?.message} {...register('name')} />
        <Input label="State Code" required placeholder="MH" error={errors.code?.message} {...register('code')} />
        <Button type="submit" fullWidth loading={mutation.isPending}>Add State</Button>
      </form>
    </Modal>
  );
}

function AddDistrictModal({ open, onClose, states, onSuccess }: { open: boolean; onClose: () => void; states: { id: number; name: string }[]; onSuccess: () => void }) {
  const schema = z.object({ name: z.string().min(1), stateId: z.string().min(1) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: { name: string; stateId: string }) => territoriesApi.createDistrict({ name: data.name, stateId: Number(data.stateId) }),
    onSuccess: () => { toast.success('District added!'); reset(); onSuccess(); },
    onError: (err: AxiosError<{ error: { message: string } }>) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add District">
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3">
        <Select label="State" required options={states.map(s => ({ value: s.id, label: s.name }))} placeholder="Select state" error={errors.stateId?.message} {...register('stateId')} />
        <Input label="District Name" required placeholder="Mumbai City" error={errors.name?.message} {...register('name')} />
        <Button type="submit" fullWidth loading={mutation.isPending}>Add District</Button>
      </form>
    </Modal>
  );
}

function AddCityModal({ open, onClose, districts, onSuccess }: { open: boolean; onClose: () => void; districts: { id: number; name: string }[]; onSuccess: () => void }) {
  const schema = z.object({ name: z.string().min(1), districtId: z.string().min(1) });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: { name: string; districtId: string }) => territoriesApi.createCity({ name: data.name, districtId: Number(data.districtId) }),
    onSuccess: () => { toast.success('City added!'); reset(); onSuccess(); },
    onError: (err: AxiosError<{ error: { message: string } }>) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add City">
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3">
        <Select label="District" required options={districts.map(d => ({ value: d.id, label: d.name }))} placeholder="Select district" error={errors.districtId?.message} {...register('districtId')} />
        <Input label="City Name" required placeholder="Mumbai" error={errors.name?.message} {...register('name')} />
        <Button type="submit" fullWidth loading={mutation.isPending}>Add City</Button>
      </form>
    </Modal>
  );
}

function AddTerritoryModal({ open, onClose, cities, onSuccess }: { open: boolean; onClose: () => void; cities: { id: number; name: string }[]; onSuccess: () => void }) {
  const schema = z.object({ name: z.string().min(1), cityId: z.string().min(1), code: z.string().optional(), description: z.string().optional() });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: { name: string; cityId: string; code?: string; description?: string }) =>
      territoriesApi.create({ name: data.name, cityId: Number(data.cityId), code: data.code, description: data.description }),
    onSuccess: () => { toast.success('Territory added!'); reset(); onSuccess(); },
    onError: (err: AxiosError<{ error: { message: string } }>) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Territory">
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3">
        <Select label="City" required options={cities.map(c => ({ value: c.id, label: c.name }))} placeholder="Select city" error={errors.cityId?.message} {...register('cityId')} />
        <Input label="Territory Name" required placeholder="Andheri West" error={errors.name?.message} {...register('name')} />
        <Input label="Code" placeholder="MH-MUM-AW" {...register('code')} />
        <Input label="Description" placeholder="Description..." {...register('description')} />
        <Button type="submit" fullWidth loading={mutation.isPending}>Add Territory</Button>
      </form>
    </Modal>
  );
}

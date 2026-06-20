import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { visitsApi } from '@/api/visits';
import { doctorsApi } from '@/api/doctors';
import { chemistsApi } from '@/api/chemists';
import { territoriesApi } from '@/api/territories';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import dayjs from 'dayjs';

const schema = z.object({
  visitType: z.enum(['DOCTOR', 'CHEMIST']),
  doctorId: z.string().optional(),
  chemistId: z.string().optional(),
  territoryId: z.string().optional(),
  visitDate: z.string().min(1, 'Date required'),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
  status: z.enum(['COMPLETED', 'CANCELLED', 'PENDING']),
  products: z.array(z.object({
    productName: z.string().min(1, 'Product name required'),
    details: z.string().optional(),
    quantity: z.string().optional(),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

export default function VisitFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const prefillDoctorId = searchParams.get('doctorId');
  const prefillChemistId = searchParams.get('chemistId');

  const { register, handleSubmit, watch, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitType: prefillDoctorId ? 'DOCTOR' : prefillChemistId ? 'CHEMIST' : 'DOCTOR',
      visitDate: dayjs().format('YYYY-MM-DD'),
      status: 'COMPLETED',
      doctorId: prefillDoctorId ?? '',
      chemistId: prefillChemistId ?? '',
      products: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });
  const visitType = watch('visitType');

  const { data: visit } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitsApi.get(id!),
    select: r => r.data.data,
    enabled: isEdit,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors', 'list'],
    queryFn: () => doctorsApi.list({ limit: 100, isActive: 'true' }),
    select: r => r.data.data,
  });

  const { data: chemists } = useQuery({
    queryKey: ['chemists', 'list'],
    queryFn: () => chemistsApi.list({ limit: 100, isActive: 'true' }),
    select: r => r.data.data,
  });

  const { data: territories } = useQuery({
    queryKey: ['territories', 'list'],
    queryFn: () => territoriesApi.list({ isActive: 'true' }),
    select: r => r.data.data,
  });

  useEffect(() => {
    if (visit) {
      reset({
        visitType: visit.visitType,
        doctorId: visit.doctorId ?? '',
        chemistId: visit.chemistId ?? '',
        territoryId: visit.territoryId?.toString() ?? '',
        visitDate: dayjs(visit.visitDate).format('YYYY-MM-DD'),
        purpose: visit.purpose ?? '',
        notes: visit.notes ?? '',
        followUpDate: visit.followUpDate ? dayjs(visit.followUpDate).format('YYYY-MM-DD') : '',
        followUpNotes: visit.followUpNotes ?? '',
        status: visit.status,
        products: visit.products?.map(p => ({
          productName: p.productName,
          details: p.details ?? '',
          quantity: p.quantity ?? '',
        })) ?? [],
      });
    }
  }, [visit, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => visitsApi.create({
      visitType: data.visitType,
      doctorId: data.visitType === 'DOCTOR' ? data.doctorId : undefined,
      chemistId: data.visitType === 'CHEMIST' ? data.chemistId : undefined,
      territoryId: data.territoryId ? Number(data.territoryId) : undefined,
      visitDate: data.visitDate,
      purpose: data.purpose || undefined,
      notes: data.notes || undefined,
      followUpDate: data.followUpDate || undefined,
      followUpNotes: data.followUpNotes || undefined,
      status: data.status,
      products: data.products?.filter(p => p.productName),
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Visit logged!');
      navigate(`/visits/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => visitsApi.update(id!, {
      purpose: data.purpose || undefined,
      notes: data.notes || undefined,
      followUpDate: data.followUpDate || undefined,
      followUpNotes: data.followUpNotes || undefined,
      status: data.status,
      products: data.products?.filter(p => p.productName),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visit', id] });
      qc.invalidateQueries({ queryKey: ['visits'] });
      toast.success('Visit updated!');
      navigate(`/visits/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const onSubmit = (data: FormData) => isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const doctorOptions = doctors?.map(d => ({ value: d.id, label: d.name })) ?? [];
  const chemistOptions = chemists?.map(c => ({ value: c.id, label: c.shopName })) ?? [];
  const territoryOptions = territories?.map(t => ({ value: t.id, label: t.name })) ?? [];

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Visit' : 'Log Visit'}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <Card>
            <Select
              label="Visit Type"
              required
              options={[{ value: 'DOCTOR', label: 'Doctor Visit' }, { value: 'CHEMIST', label: 'Chemist Visit' }]}
              {...register('visitType')}
            />
          </Card>
        )}

        <Card>
          <div className="space-y-4">
            {!isEdit && visitType === 'DOCTOR' && (
              <Select
                label="Doctor"
                required
                options={doctorOptions}
                placeholder="Select doctor"
                error={errors.doctorId?.message}
                {...register('doctorId')}
              />
            )}
            {!isEdit && visitType === 'CHEMIST' && (
              <Select
                label="Chemist"
                required
                options={chemistOptions}
                placeholder="Select chemist"
                error={errors.chemistId?.message}
                {...register('chemistId')}
              />
            )}
            {!isEdit && (
              <Select
                label="Territory"
                options={territoryOptions}
                placeholder="Select territory"
                {...register('territoryId')}
              />
            )}
            <Input label="Visit Date" type="date" required error={errors.visitDate?.message} {...register('visitDate')} />
            <Select
              label="Status"
              options={[
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              {...register('status')}
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <Textarea label="Purpose" placeholder="Purpose of visit..." {...register('purpose')} />
            <Textarea label="Notes" placeholder="Visit notes..." {...register('notes')} />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <Input label="Follow-up Date" type="date" {...register('followUpDate')} />
            <Textarea label="Follow-up Notes" placeholder="What to follow up on..." {...register('followUpNotes')} />
          </div>
        </Card>

        {/* Products */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Products Discussed</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => append({ productName: '', details: '', quantity: '' })}>
              <Plus size={14} /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Product {i + 1}</span>
                  <button type="button" onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                <Input placeholder="Product name *" error={errors.products?.[i]?.productName?.message} {...register(`products.${i}.productName`)} />
                <Input placeholder="Details" {...register(`products.${i}.details`)} />
                <Input placeholder="Quantity" {...register(`products.${i}.quantity`)} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" fullWidth loading={isSaving}>
            {isEdit ? 'Save Changes' : 'Log Visit'}
          </Button>
        </div>
      </form>
    </div>
  );
}

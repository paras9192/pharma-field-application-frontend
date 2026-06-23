import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chemistsApi } from '@/api/chemists';
import { territoriesApi } from '@/api/territories';
import { useLocation } from '@/hooks/useLocation';
import { LocationBanner } from '@/components/common/LocationBanner';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const schema = z.object({
  shopName: z.string().min(1, 'Shop name required'),
  ownerName: z.string().min(1, 'Owner name required'),
  phone: z.string().min(1, 'Phone required'),
  alternatePhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  territoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ChemistFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const location = useLocation(!isEdit);

  const { data: chemist } = useQuery({
    queryKey: ['chemist', id],
    queryFn: () => chemistsApi.get(id!),
    select: r => r.data.data,
    enabled: isEdit,
  });

  const { data: territories } = useQuery({
    queryKey: ['territories', 'list'],
    queryFn: () => territoriesApi.list({ isActive: 'true' }),
    select: r => r.data.data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (chemist) {
      reset({
        shopName: chemist.shopName,
        ownerName: chemist.ownerName,
        phone: chemist.phone,
        alternatePhone: chemist.alternatePhone ?? '',
        email: chemist.email ?? '',
        gstNumber: chemist.gstNumber ?? '',
        address: chemist.address ?? '',
        territoryId: chemist.territoryId?.toString() ?? '',
      });
    }
  }, [chemist, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => chemistsApi.create({
      shopName: data.shopName,
      ownerName: data.ownerName,
      phone: data.phone,
      alternatePhone: data.alternatePhone || undefined,
      email: data.email || undefined,
      gstNumber: data.gstNumber || undefined,
      address: data.address || undefined,
      territoryId: data.territoryId ? Number(data.territoryId) : undefined,
      latitude: location.lat ?? undefined,
      longitude: location.lng ?? undefined,
      locationCapturedAt: location.capturedAt ?? undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['chemists'] });
      toast.success('Chemist added!');
      navigate(`/chemists/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => chemistsApi.update(id!, {
      shopName: data.shopName,
      ownerName: data.ownerName,
      phone: data.phone,
      alternatePhone: data.alternatePhone || undefined,
      email: data.email || undefined,
      gstNumber: data.gstNumber || undefined,
      address: data.address || undefined,
      territoryId: data.territoryId ? Number(data.territoryId) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chemist', id] });
      qc.invalidateQueries({ queryKey: ['chemists'] });
      toast.success('Chemist updated!');
      navigate(`/chemists/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const onSubmit = (data: FormData) => isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;
  const territoryOptions = territories?.map(t => ({ value: t.id, label: t.name })) ?? [];

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{isEdit ? 'Edit Chemist' : 'Add Chemist'}</h2>
      {!isEdit && <div className="mb-4"><LocationBanner location={location} /></div>}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Shop Name" required placeholder="Raj Medical Store" error={errors.shopName?.message} {...register('shopName')} />
          <Input label="Owner Name" required placeholder="Raj Kumar" error={errors.ownerName?.message} {...register('ownerName')} />
          <Input label="Phone" required type="tel" placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Alternate Phone" type="tel" placeholder="9876543211" {...register('alternatePhone')} />
          <Input label="Email" type="email" placeholder="raj@medical.com" error={errors.email?.message} {...register('email')} />
          <Input label="GST Number" placeholder="27AAPFU0939F1ZV" {...register('gstNumber')} />
          <Input label="Address" placeholder="456 Market Road, Mumbai" {...register('address')} />
          <Select label="Territory" options={territoryOptions} placeholder="Select territory" {...register('territoryId')} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" fullWidth loading={isSaving}>
              {isEdit ? 'Save Changes' : 'Add Chemist'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

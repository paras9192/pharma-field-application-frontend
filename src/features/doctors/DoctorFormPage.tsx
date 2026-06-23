import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi } from '@/api/doctors';
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
  name: z.string().min(1, 'Name is required'),
  specialization: z.string().optional(),
  clinicName: z.string().optional(),
  hospitalName: z.string().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  territoryId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DoctorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const location = useLocation(!isEdit);

  const { data: doctor } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorsApi.get(id!),
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
    if (doctor) {
      reset({
        name: doctor.name,
        specialization: doctor.specialization ?? '',
        clinicName: doctor.clinicName ?? '',
        hospitalName: doctor.hospitalName ?? '',
        phone: doctor.phone ?? '',
        alternatePhone: doctor.alternatePhone ?? '',
        email: doctor.email ?? '',
        address: doctor.address ?? '',
        territoryId: doctor.territoryId?.toString() ?? '',
      });
    }
  }, [doctor, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => doctorsApi.create({
      name: data.name,
      specialization: data.specialization || undefined,
      clinicName: data.clinicName || undefined,
      hospitalName: data.hospitalName || undefined,
      phone: data.phone || undefined,
      alternatePhone: data.alternatePhone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      territoryId: data.territoryId ? Number(data.territoryId) : undefined,
      latitude: location.lat ?? undefined,
      longitude: location.lng ?? undefined,
      locationCapturedAt: location.capturedAt ?? undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor added!');
      navigate(`/doctors/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => doctorsApi.update(id!, {
      name: data.name,
      specialization: data.specialization || undefined,
      clinicName: data.clinicName || undefined,
      hospitalName: data.hospitalName || undefined,
      phone: data.phone || undefined,
      alternatePhone: data.alternatePhone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      territoryId: data.territoryId ? Number(data.territoryId) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', id] });
      qc.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor updated!');
      navigate(`/doctors/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  const territoryOptions = territories?.map(t => ({ value: t.id, label: t.name })) ?? [];

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h2>
      {!isEdit && <div className="mb-4"><LocationBanner location={location} /></div>}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" required placeholder="Dr. Raj Patel" error={errors.name?.message} {...register('name')} />
          <Input label="Specialization" placeholder="Cardiologist" {...register('specialization')} />
          <Input label="Clinic Name" placeholder="Heart Care Clinic" {...register('clinicName')} />
          <Input label="Hospital Name" placeholder="City Hospital" {...register('hospitalName')} />
          <Input label="Phone" type="tel" placeholder="9876543210" {...register('phone')} />
          <Input label="Alternate Phone" type="tel" placeholder="9876543211" {...register('alternatePhone')} />
          <Input label="Email" type="email" placeholder="dr.raj@hospital.com" error={errors.email?.message} {...register('email')} />
          <Input label="Address" placeholder="123 Main St, Mumbai" {...register('address')} />
          <Select
            label="Territory"
            options={territoryOptions}
            placeholder="Select territory"
            {...register('territoryId')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" fullWidth loading={isSaving}>
              {isEdit ? 'Save Changes' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

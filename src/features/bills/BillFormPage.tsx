import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '@/api/bills';
import { chemistsApi } from '@/api/chemists';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const schema = z.object({
  chemistId: z.string().min(1, 'Select a chemist'),
  totalAmount: z.coerce.number().min(0.01, 'Enter amount'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function BillFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  const prefillOrderId = searchParams.get('orderId') ?? undefined;
  const prefillChemistId = searchParams.get('chemistId') ?? undefined;
  const prefillAmount = searchParams.get('amount') ?? undefined;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      chemistId: prefillChemistId ?? '',
      totalAmount: prefillAmount ? Number(prefillAmount) : undefined,
    },
  });

  const chemistsQuery = useQuery({
    queryKey: ['chemists-all'],
    queryFn: () => chemistsApi.list({ limit: 200 }),
    select: r => r.data.data,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => billsApi.create({
      chemistId: data.chemistId,
      orderId: prefillOrderId,
      totalAmount: data.totalAmount,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Bill created!');
      navigate(`/bills/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create bill');
    },
  });

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-slate-800">New Bill</h2>

      {prefillOrderId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
          Linked to order — amount pre-filled
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
          <Select
            label="Chemist"
            required
            placeholder="Select chemist"
            options={(chemistsQuery.data ?? []).map(c => ({ value: c.id, label: `${c.shopName} — ${c.ownerName}` }))}
            error={errors.chemistId?.message}
            {...register('chemistId')}
          />
          <Input
            label="Total Amount (₹)"
            type="number"
            step="0.01"
            min={0.01}
            required
            error={errors.totalAmount?.message}
            {...register('totalAmount')}
          />
          <Input
            label="Due Date"
            type="date"
            {...register('dueDate')}
          />
          <Input
            label="Notes"
            placeholder="Net 30 days, etc."
            {...register('notes')}
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" fullWidth loading={mutation.isPending}>Create Bill</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

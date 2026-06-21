import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { ordersApi } from '@/api/orders';
import { chemistsApi } from '@/api/chemists';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const itemSchema = z.object({
  productName: z.string().min(1, 'Required'),
  quantity: z.coerce.number().min(1, 'Min 1'),
  rate: z.coerce.number().min(0.01, 'Min 0.01'),
  notes: z.string().optional(),
});

const schema = z.object({
  chemistId: z.string().min(1, 'Select a chemist'),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type FormData = z.infer<typeof schema>;

export default function OrderFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ productName: '', quantity: 1, rate: 0, notes: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const chemistsQuery = useQuery({
    queryKey: ['chemists-all'],
    queryFn: () => chemistsApi.list({ limit: 200 }),
    select: r => r.data.data,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => ordersApi.create({
      chemistId: data.chemistId,
      expectedDelivery: data.expectedDelivery || undefined,
      notes: data.notes || undefined,
      items: data.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        rate: i.rate,
        notes: i.notes || undefined,
      })),
    }),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created!');
      navigate(`/orders/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create order');
    },
  });

  const watchedItems = watch('items');
  const total = watchedItems?.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0) ?? 0;

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-slate-800">New Order</h2>

      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-4">
        <Card>
          <h3 className="font-semibold text-slate-700 mb-3">Order Info</h3>
          <div className="space-y-3">
            <Select
              label="Chemist"
              required
              placeholder="Select chemist"
              options={(chemistsQuery.data ?? []).map(c => ({ value: c.id, label: `${c.shopName} — ${c.ownerName}` }))}
              error={errors.chemistId?.message}
              {...register('chemistId')}
            />
            <Input label="Expected Delivery" type="date" {...register('expectedDelivery')} />
            <Input label="Notes" placeholder="Urgent delivery, special instructions..." {...register('notes')} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700">Items</h3>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => append({ productName: '', quantity: 1, rate: 0, notes: '' })}
            >
              <Plus size={14} /> Add Item
            </Button>
          </div>

          {errors.items?.root && (
            <p className="text-xs text-red-500 mb-2">{errors.items.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Product name"
                  required
                  error={errors.items?.[index]?.productName?.message}
                  {...register(`items.${index}.productName`)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Qty"
                    type="number"
                    min={1}
                    required
                    error={errors.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity`)}
                  />
                  <Input
                    label="Rate (₹)"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    error={errors.items?.[index]?.rate?.message}
                    {...register(`items.${index}.rate`)}
                  />
                </div>
                <Input placeholder="Notes (optional)" {...register(`items.${index}.notes`)} />
                <div className="text-right text-xs font-semibold text-slate-600">
                  ₹{((Number(watchedItems?.[index]?.quantity) || 0) * (Number(watchedItems?.[index]?.rate) || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-lg font-bold text-slate-800">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" fullWidth loading={mutation.isPending}>Create Order</Button>
        </div>
      </form>
    </div>
  );
}

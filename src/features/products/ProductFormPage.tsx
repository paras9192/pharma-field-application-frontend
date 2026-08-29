import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { dosageFormOptions, drugScheduleOptions } from './productMeta';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import type { CreateProductPayload, DosageForm, DrugSchedule } from '@/types/api';

const decimalStr = (max2 = true) =>
  z.string().trim().regex(max2 ? /^\d+(\.\d{1,2})?$/ : /^\d+$/, 'Enter a valid number');
const optionalDecimal = z.union([z.literal(''), decimalStr()]);
const optionalInt = z.union([z.literal(''), z.string().trim().regex(/^\d+$/, 'Whole number only')]);

const schema = z.object({
  name: z.string().trim().min(1, 'Name required').max(200),
  description: z.string().max(2000).optional(),
  dosageForm: z.string().optional(),
  composition: z.string().max(500).optional(),
  packSize: z.string().max(100).optional(),
  unitOfMeasure: z.string().max(50).optional(),
  manufacturer: z.string().max(200).optional(),
  marketedBy: z.string().max(200).optional(),
  hsnCode: z.string().max(20).optional(),
  barcode: z.string().max(64).optional(),
  rate: optionalDecimal,
  mrp: optionalDecimal,
  gstRate: optionalDecimal,
  inventory: optionalInt,
  reorderLevel: optionalInt,
  drugSchedule: z.string().optional(),
  prescriptionRequired: z.boolean(),
  storageInstructions: z.string().max(300).optional(),
  isSampleAllowed: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const num = (v: string | undefined) => (v && v !== '' ? Number(v) : undefined);
const str = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    select: r => r.data.data,
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { prescriptionRequired: true, isSampleAllowed: false },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        dosageForm: product.dosageForm ?? '',
        composition: product.composition ?? '',
        packSize: product.packSize ?? '',
        unitOfMeasure: product.unitOfMeasure ?? '',
        manufacturer: product.manufacturer ?? '',
        marketedBy: product.marketedBy ?? '',
        hsnCode: product.hsnCode ?? '',
        barcode: product.barcode ?? '',
        rate: product.rate ?? '',
        mrp: product.mrp ?? '',
        gstRate: product.gstRate ?? '',
        inventory: String(product.inventory ?? ''),
        reorderLevel: product.reorderLevel != null ? String(product.reorderLevel) : '',
        drugSchedule: product.drugSchedule ?? '',
        prescriptionRequired: product.prescriptionRequired,
        storageInstructions: product.storageInstructions ?? '',
        isSampleAllowed: product.isSampleAllowed,
      });
    }
  }, [product, reset]);

  const toPayload = (data: FormData): CreateProductPayload => ({
    name: data.name.trim(),
    description: str(data.description),
    dosageForm: (data.dosageForm || undefined) as DosageForm | undefined,
    composition: str(data.composition),
    packSize: str(data.packSize),
    unitOfMeasure: str(data.unitOfMeasure),
    manufacturer: str(data.manufacturer),
    marketedBy: str(data.marketedBy),
    hsnCode: str(data.hsnCode),
    barcode: str(data.barcode),
    rate: num(data.rate),
    mrp: num(data.mrp),
    gstRate: num(data.gstRate),
    inventory: num(data.inventory),
    reorderLevel: num(data.reorderLevel),
    drugSchedule: (data.drugSchedule || undefined) as DrugSchedule | undefined,
    prescriptionRequired: data.prescriptionRequired,
    storageInstructions: str(data.storageInstructions),
    isSampleAllowed: data.isSampleAllowed,
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => productsApi.create(toPayload(data)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added!');
      navigate(`/products/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    },
  });

  const updateMutation = useMutation({
    // On edit, `inventory` is managed through the stock-adjust flow, not here.
    mutationFn: (data: FormData) => {
      const payload = toPayload(data);
      delete payload.inventory;
      return productsApi.update(id!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated!');
      navigate(`/products/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
    },
  });

  const onSubmit = (data: FormData) => isEdit ? updateMutation.mutate(data) : createMutation.mutate(data);
  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) return <ListSkeleton />;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Identity</h3>
          <Input label="Name" required placeholder="Amoxicillin 500mg" error={errors.name?.message} {...register('name')} />
          {isEdit && product?.productCode && (
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1">Product Code</span>
              <p className="font-mono text-sm text-slate-500">{product.productCode}</p>
            </div>
          )}
          {!isEdit && (
            <p className="text-xs text-slate-400">Product code is generated automatically on save.</p>
          )}
          <Textarea label="Description" placeholder="Broad-spectrum antibiotic" error={errors.description?.message} {...register('description')} />
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Formulation</h3>
          <Select label="Dosage Form" placeholder="Select dosage form" options={dosageFormOptions} error={errors.dosageForm?.message} {...register('dosageForm')} />
          <Input label="Composition" placeholder="Amoxicillin Trihydrate 500mg" error={errors.composition?.message} {...register('composition')} />
          <Input label="Pack Size" placeholder="10x10 capsules" error={errors.packSize?.message} {...register('packSize')} />
          <Input label="Unit of Measure" placeholder="STRIP" error={errors.unitOfMeasure?.message} {...register('unitOfMeasure')} />
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Commercial</h3>
          <Input label="Rate / PTR (₹)" type="text" inputMode="decimal" placeholder="85.50" error={errors.rate?.message} {...register('rate')} />
          <Input label="MRP (₹)" type="text" inputMode="decimal" placeholder="120.00" error={errors.mrp?.message} {...register('mrp')} />
          <Input label="GST Rate (%)" type="text" inputMode="decimal" placeholder="12" error={errors.gstRate?.message} {...register('gstRate')} />
          <Input label="HSN Code" placeholder="30049099" error={errors.hsnCode?.message} {...register('hsnCode')} />
          <Input label="Barcode" placeholder="8901234567890" error={errors.barcode?.message} {...register('barcode')} />
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Inventory</h3>
          {!isEdit && (
            <Input label="Opening Stock" type="text" inputMode="numeric" placeholder="0" error={errors.inventory?.message} {...register('inventory')} />
          )}
          <Input label="Reorder Level" type="text" inputMode="numeric" placeholder="50" hint="Low-stock threshold" error={errors.reorderLevel?.message} {...register('reorderLevel')} />
          {isEdit && (
            <p className="text-xs text-slate-400">Adjust stock from the product page.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Manufacturer</h3>
          <Input label="Manufacturer" placeholder="ABC Pharma Ltd" error={errors.manufacturer?.message} {...register('manufacturer')} />
          <Input label="Marketed By" placeholder="XYZ Healthcare" error={errors.marketedBy?.message} {...register('marketedBy')} />
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Regulatory</h3>
          <Select label="Drug Schedule" placeholder="Select schedule" options={drugScheduleOptions} error={errors.drugSchedule?.message} {...register('drugSchedule')} />
          <Input label="Storage Instructions" placeholder="Store below 25°C, protect from light" error={errors.storageInstructions?.message} {...register('storageInstructions')} />
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300" {...register('prescriptionRequired')} />
            Prescription required
          </label>
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300" {...register('isSampleAllowed')} />
            Sample allowed
          </label>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" fullWidth loading={isSaving}>
            {isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

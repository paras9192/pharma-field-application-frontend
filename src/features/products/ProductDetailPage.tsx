import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2, Trash2, RotateCcw, Package, ImageIcon, X, Plus, Minus, Hash, Barcode,
  FlaskConical, Factory, ShieldCheck, Thermometer, MapPin,
} from 'lucide-react';
import { productsApi } from '@/api/products';
import { useAuthStore } from '@/store/authStore';
import { canManageProducts } from '@/utils/permissions';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { dosageFormLabel, drugScheduleLabel, formatMoney, isLowStock } from './productMeta';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { Product } from '@/types/api';

const ALLOWED = /\.(jpg|jpeg|png|webp)$/i;
const apiErr = (err: AxiosError<{ error: { message: string } }>, fallback: string) =>
  err.response?.data?.error?.message || fallback;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const role = useAuthStore(s => s.user?.role);
  const canManage = !!role && canManageProducts(role);

  const fileRef = useRef<HTMLInputElement>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['product', id] });
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  const deactivateMutation = useMutation({
    mutationFn: () => productsApi.deactivate(id!),
    onSuccess: () => { toast.success('Product deactivated'); invalidate(); },
    onError: (e: AxiosError<{ error: { message: string } }>) => toast.error(apiErr(e, 'Failed to deactivate')),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => productsApi.update(id!, { isActive: true }),
    onSuccess: () => { toast.success('Product re-activated'); invalidate(); },
    onError: (e: AxiosError<{ error: { message: string } }>) => toast.error(apiErr(e, 'Failed to re-activate')),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => productsApi.uploadImages(id!, files),
    onSuccess: () => { toast.success('Image uploaded'); invalidate(); },
    onError: (e: AxiosError<{ error: { message: string } }>) => toast.error(apiErr(e, 'Failed to upload')),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => productsApi.deleteImage(id!, imageId),
    onSuccess: () => { toast.success('Image deleted'); invalidate(); setDeletingImageId(null); },
    onError: (e: AxiosError<{ error: { message: string } }>) => { toast.error(apiErr(e, 'Failed to delete image')); setDeletingImageId(null); },
  });

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;
  const p = query.data;
  if (!p) return null;

  const low = isLowStock(p.inventory, p.reorderLevel);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter(f => ALLOWED.test(f.name));
    if (valid.length !== files.length) {
      toast.error('Only JPG, PNG, or WEBP images allowed');
      return;
    }
    if (valid.length) uploadMutation.mutate(valid);
    e.target.value = '';
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {p.images?.[0]
              ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
              : <Package size={22} className="text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{p.name}</h2>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!p.isActive && <Badge variant="danger">Inactive</Badge>}
                {low && <Badge variant="warning">Low stock</Badge>}
              </div>
            </div>
            <div className="text-sm text-slate-400 font-mono mt-0.5">{p.productCode}</div>
            <div className="text-xs text-slate-400 mt-1">Added {dayjs(p.createdAt).format('MMM D, YYYY')}</div>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <Link to={`/products/${id}/edit`} className="flex-1 min-w-[120px]">
              <Button variant="outline" size="sm" fullWidth><Edit2 size={14} /> Edit</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowAdjust(true)}>
              <Package size={14} /> Adjust Stock
            </Button>
            {p.isActive ? (
              <Button variant="danger" size="sm" loading={deactivateMutation.isPending}
                onClick={() => { if (confirm('Deactivate this product?')) deactivateMutation.mutate(); }}>
                <Trash2 size={14} />
              </Button>
            ) : (
              <Button variant="outline" size="sm" loading={reactivateMutation.isPending}
                onClick={() => reactivateMutation.mutate()}>
                <RotateCcw size={14} /> Re-activate
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Pricing + stock */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Rate / PTR" value={formatMoney(p.rate)} />
        <StatTile label="MRP" value={formatMoney(p.mrp)} />
        <StatTile label="GST" value={p.gstRate != null ? `${Number(p.gstRate)}%` : '—'} />
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">In stock</div>
            <div className={`text-2xl font-bold ${low ? 'text-amber-600' : 'text-slate-800'}`}>{p.inventory}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Reorder level</div>
            <div className="text-sm font-medium text-slate-600">{p.reorderLevel ?? '—'}</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Details</h3>
        <div className="space-y-2.5">
          <InfoRow icon={<FlaskConical size={15} />} label="Dosage Form" value={dosageFormLabel(p.dosageForm)} />
          {p.composition && <InfoRow icon={<FlaskConical size={15} />} label="Composition" value={p.composition} />}
          {p.packSize && <InfoRow icon={<Package size={15} />} label="Pack Size" value={p.packSize} />}
          {p.unitOfMeasure && <InfoRow icon={<Package size={15} />} label="Unit" value={p.unitOfMeasure} />}
          {p.manufacturer && <InfoRow icon={<Factory size={15} />} label="Manufacturer" value={p.manufacturer} />}
          {p.marketedBy && <InfoRow icon={<Factory size={15} />} label="Marketed By" value={p.marketedBy} />}
          {p.hsnCode && <InfoRow icon={<Hash size={15} />} label="HSN Code" value={p.hsnCode} />}
          {p.barcode && <InfoRow icon={<Barcode size={15} />} label="Barcode" value={p.barcode} />}
          {p.rackNo && <InfoRow icon={<MapPin size={15} />} label="Rack No." value={p.rackNo} />}
          <InfoRow icon={<ShieldCheck size={15} />} label="Drug Schedule" value={drugScheduleLabel(p.drugSchedule)} />
          <InfoRow icon={<ShieldCheck size={15} />} label="Prescription" value={p.prescriptionRequired ? 'Required' : 'Not required'} />
          <InfoRow icon={<Package size={15} />} label="Sample" value={p.isSampleAllowed ? 'Allowed' : 'Not allowed'} />
          {p.storageInstructions && <InfoRow icon={<Thermometer size={15} />} label="Storage" value={p.storageInstructions} />}
        </div>
        {p.description && <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{p.description}</p>}
      </Card>

      {/* Images */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ImageIcon size={15} /> Photos {(p.images?.length ?? 0) > 0 && `(${p.images.length})`}
          </h3>
          {canManage && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              <Button type="button" size="sm" variant="ghost" loading={uploadMutation.isPending}
                onClick={() => fileRef.current?.click()}>
                Add Photo
              </Button>
            </>
          )}
        </div>
        {!p.images?.length ? (
          <div className="text-sm text-slate-400 text-center py-4">No photos yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {p.images.map(img => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={img.url} alt={img.filename} className="w-full h-32 object-cover" />
                {canManage && (
                  <button
                    type="button"
                    onClick={() => { if (confirm('Delete this image?')) { setDeletingImageId(img.id); deleteImageMutation.mutate(img.id); } }}
                    disabled={deletingImageId === img.id}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {(p.createdBy || p.updatedBy) && (
        <Card padding="sm">
          <div className="text-xs text-slate-400 space-y-0.5">
            {p.createdBy && <div>Added by <span className="font-medium text-slate-600">{p.createdBy.name}</span></div>}
            {p.updatedBy && <div>Last updated by <span className="font-medium text-slate-600">{p.updatedBy.name}</span> · {dayjs(p.updatedAt).format('MMM D, YYYY')}</div>}
          </div>
        </Card>
      )}

      {canManage && (
        <AdjustStockModal open={showAdjust} product={p} onClose={() => setShowAdjust(false)} onDone={invalidate} />
      )}
    </div>
  );
}

function AdjustStockModal({
  open, product, onClose, onDone,
}: {
  open: boolean;
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const [dir, setDir] = useState<1 | -1>(1);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const amount = Number(qty);
  const valid = Number.isInteger(amount) && amount > 0;
  const delta = valid ? dir * amount : 0;
  const projected = product.inventory + delta;

  const mutation = useMutation({
    mutationFn: () => productsApi.adjustInventory(product.id, delta, reason.trim() || undefined),
    onSuccess: () => {
      toast.success('Stock updated');
      onDone();
      handleClose();
    },
    onError: (e: AxiosError<{ error: { message: string } }>) =>
      toast.error(apiErr(e, 'Failed to adjust stock')),
  });

  const handleClose = () => { setDir(1); setQty(''); setReason(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Adjust Stock">
      <div className="space-y-4">
        <div className="text-sm text-slate-500">
          Current stock: <span className="font-semibold text-slate-800">{product.inventory}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDir(1)}
            className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium transition-colors ${
              dir === 1 ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Plus size={15} /> Add
          </button>
          <button
            type="button"
            onClick={() => setDir(-1)}
            className={`flex items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium transition-colors ${
              dir === -1 ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            <Minus size={15} /> Remove
          </button>
        </div>

        <Input
          label="Quantity"
          type="text"
          inputMode="numeric"
          placeholder="100"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />

        <Textarea
          label="Reason"
          placeholder="Stock received from warehouse"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />

        {valid && (
          <div className={`text-sm rounded-xl px-3 py-2 ${projected < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
            New stock will be <span className="font-semibold">{projected}</span>
            {projected < 0 && ' — cannot go below zero'}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={handleClose}>Cancel</Button>
          <Button
            fullWidth
            disabled={!valid || projected < 0}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm" className="text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-bold text-slate-800 mt-0.5">{value}</div>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

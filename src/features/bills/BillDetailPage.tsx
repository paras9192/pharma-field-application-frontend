import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, IndianRupee, Package, Upload, RotateCcw, ImageIcon, FileText, Trash2 } from 'lucide-react';
import { billsApi } from '@/api/bills';
import { paymentsApi } from '@/api/payments';
import { useAuthStore } from '@/store/authStore';
import { canUploadBillImage, canDeleteBillImage } from '@/utils/permissions';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import type { BillStatus, PaymentMode, SettlementType } from '@/types/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { type AxiosError } from 'axios';

import { BACKEND_ORIGIN } from '@/api/axios';
const BACKEND_URL = BACKEND_ORIGIN;

const billStatusVariant: Record<BillStatus, string> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'success',
};

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const SETTLEMENT_TYPES: { value: SettlementType; label: string }[] = [
  { value: 'GOODS_RETURN', label: 'Goods Return' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
  { value: 'DISCOUNT', label: 'Discount' },
];

const MODES_WITH_REF: PaymentMode[] = ['CHEQUE', 'UPI', 'NEFT', 'BANK_TRANSFER'];

const SETTLEMENT_COLOR: Record<SettlementType, string> = {
  GOODS_RETURN: 'bg-orange-50 text-orange-700',
  CREDIT_NOTE: 'bg-purple-50 text-purple-700',
  DISCOUNT: 'bg-teal-50 text-teal-700',
};

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentRole = useAuthStore(s => s.user?.role);
  const canUpload = currentRole ? canUploadBillImage(currentRole) : false;
  const canDelete = currentRole ? canDeleteBillImage(currentRole) : false;

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Settlement modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleType, setSettleType] = useState<SettlementType>('GOODS_RETURN');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleError, setSettleError] = useState('');

  const query = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billsApi.get(id!),
    select: r => r.data.data,
    enabled: !!id,
  });

  const settlementsQuery = useQuery({
    queryKey: ['bill-settlements', id],
    queryFn: () => billsApi.getSettlements(id!),
    select: r => r.data.data,
    enabled: !!id,
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['bill-payments', id],
    queryFn: () => paymentsApi.list({ billId: id! }),
    select: r => r.data.data,
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => billsApi.uploadImages(id!, files),
    onSuccess: (_, files) => {
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
      qc.invalidateQueries({ queryKey: ['bill', id] });
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => billsApi.deleteImage(id!, imageId),
    onSuccess: () => {
      toast.success('Image deleted');
      qc.invalidateQueries({ queryKey: ['bill', id] });
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to delete image');
    },
  });

  const payMutation = useMutation({
    mutationFn: () => paymentsApi.collect({
      billId: id!,
      amount: Number(payAmount),
      paymentMode: payMode,
      referenceNumber: payRef || undefined,
      notes: payNotes || undefined,
    }),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['bill', id] });
      qc.invalidateQueries({ queryKey: ['bill-payments', id] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowPayModal(false);
      setPayAmount(''); setPayRef(''); setPayNotes(''); setPayError('');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      setPayError(err.response?.data?.error?.message || 'Failed to record payment');
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => billsApi.createSettlement({
      billId: id!,
      type: settleType,
      amount: Number(settleAmount),
      notes: settleNotes || undefined,
    }),
    onSuccess: () => {
      toast.success('Settlement recorded');
      qc.invalidateQueries({ queryKey: ['bill', id] });
      qc.invalidateQueries({ queryKey: ['bill-settlements', id] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      setShowSettleModal(false);
      setSettleAmount(''); setSettleNotes(''); setSettleError('');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      setSettleError(err.response?.data?.error?.message || 'Failed to record settlement');
    },
  });

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayError('Enter a valid amount'); return; }
    if (bill && amt > bill.dueAmount) { setPayError(`Cannot exceed due amount ₹${bill.dueAmount.toLocaleString('en-IN')}`); return; }
    setPayError('');
    payMutation.mutate();
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(settleAmount);
    if (!amt || amt <= 0) { setSettleError('Enter a valid amount'); return; }
    if (bill && amt > bill.dueAmount) { setSettleError(`Cannot exceed due amount ₹${bill.dueAmount.toLocaleString('en-IN')}`); return; }
    setSettleError('');
    settleMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    uploadMutation.mutate(files);
    e.target.value = '';
  };

  if (query.isLoading) return <ListSkeleton />;
  if (query.isError) return <ErrorMessage onRetry={query.refetch} />;

  const bill = query.data;
  if (!bill) return null;

  const isOverdue = bill.status !== 'PAID' && bill.dueDate && dayjs(bill.dueDate).isBefore(dayjs(), 'day');
  const images = bill.images ?? [];
  if (import.meta.env.DEV && images.length) console.log('[BillImages] sample item:', images[0]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Receipt size={22} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 font-mono">{bill.originalBillId ?? bill.billNumber}</span>
              <Badge variant={billStatusVariant[bill.status] as never}>{bill.status}</Badge>
            </div>
            <div className="text-sm text-slate-600">{bill.chemist.shopName}</div>
            {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <AmountBox label="Total" amount={bill.totalAmount} color="slate" />
          <AmountBox label="Paid" amount={bill.paidAmount} color="green" />
          <AmountBox label="Due" amount={bill.dueAmount} color={bill.dueAmount > 0 ? 'red' : 'slate'} />
        </div>

        {bill.status !== 'PAID' && (
          <div className="flex gap-2 mt-4">
            <Button fullWidth onClick={() => { setPayAmount(String(bill.dueAmount)); setShowPayModal(true); }}>
              <IndianRupee size={14} /> Collect Payment
            </Button>
            {!settlementsQuery.isError && (
              <Button variant="outline" fullWidth onClick={() => setShowSettleModal(true)}>
                <RotateCcw size={14} /> Settlement
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Bill Images */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ImageIcon size={15} /> Bill Scans {images.length > 0 && `(${images.length})`}
          </h3>
          {canUpload && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                size="sm"
                variant="ghost"
                loading={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} /> Upload
              </Button>
            </div>
          )}
        </div>

        {images.length > 0 ? (
          <div className="space-y-2">
            {images.map(img => {
              const rawPath = img.imageUrl ?? img.url ?? img.filePath ?? '';
              const url = rawPath.startsWith('http') ? rawPath : `${BACKEND_URL}${rawPath}`;
              const isPdf = rawPath.toLowerCase().endsWith('.pdf');
              if (!rawPath) return null;
              return (
                <div key={img.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {isPdf ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 hover:bg-slate-100 transition-colors"
                      >
                        <FileText size={18} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">View PDF</span>
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt="Bill scan"
                          className="w-full rounded-xl object-contain max-h-48 bg-slate-50 border border-slate-100"
                        />
                      </a>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => { if (confirm('Delete this image?')) deleteImageMutation.mutate(img.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : canUpload ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex flex-col items-center gap-2"
          >
            <Upload size={24} />
            <span className="text-sm">Upload bill images or PDFs (up to 10, max 10MB each)</span>
          </button>
        ) : (
          <div className="text-sm text-slate-400 text-center py-4">No images attached</div>
        )}
      </Card>

      {/* Details */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3">Bill Details</h3>
        <div className="space-y-2 text-sm">
          {bill.originalBillId && <Row label="Bill No." value={bill.originalBillId} />}
          <Row label="Database ID" value={bill.billNumber} />
          {bill.dueDate && (
            <Row label="Due Date" value={dayjs(bill.dueDate).format('MMM D, YYYY')} highlight={isOverdue ? 'red' : undefined} />
          )}
          {bill.notes && <Row label="Notes" value={bill.notes} />}
          <Row label="Created By" value={bill.createdBy.name} />
          <Row label="Created On" value={dayjs(bill.createdAt).format('MMM D, YYYY')} />
        </div>
      </Card>

      {/* Linked Order */}
      {bill.order && (
        <Link to={`/orders/${bill.orderId}`}>
          <Card className="hover:border-blue-200 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package size={16} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700">Linked Order</div>
                <div className="text-xs text-slate-400 font-mono">{bill.order.orderNumber}</div>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Settlements */}
      {!settlementsQuery.isError && settlementsQuery.data && settlementsQuery.data.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-3">Settlements ({settlementsQuery.data.length})</h3>
          <div className="space-y-2">
            {settlementsQuery.data.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SETTLEMENT_COLOR[s.type]}`}>
                    {s.type.replace('_', ' ')}
                  </span>
                  {s.notes && <span className="text-xs text-slate-400 truncate max-w-[120px]">{s.notes}</span>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">-₹{s.amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400">{dayjs(s.createdAt).format('MMM D')}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment History */}
      {(paymentsQuery.data?.length ?? 0) > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-700 mb-3">Payment History ({paymentsQuery.data!.length})</h3>
          <div className="space-y-2">
            {paymentsQuery.data!.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">₹{p.amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-slate-400">
                    {p.paymentMode.replace('_', ' ')}
                    {p.referenceNumber && ` · ${p.referenceNumber}`}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  {p.collectedBy
                    ? <div className="text-xs text-slate-500">Collected by <span className="font-medium text-slate-700">{p.collectedBy.name}</span></div>
                    : <div />
                  }
                  <div className="text-xs text-slate-400">{dayjs(p.createdAt).format('MMM D, YYYY')}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Collect Payment Modal */}
      <Modal open={showPayModal} onClose={() => { setShowPayModal(false); setPayError(''); }} title="Collect Payment">
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min={0.01}
            required
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            hint={`Due: ₹${bill.dueAmount.toLocaleString('en-IN')}`}
            error={payError}
          />
          <Select
            label="Payment Mode"
            required
            value={payMode}
            onChange={e => setPayMode(e.target.value as PaymentMode)}
            options={PAYMENT_MODES}
          />
          {MODES_WITH_REF.includes(payMode) && (
            <Input
              label="Reference Number"
              placeholder="Cheque no / UPI ref / NEFT ref"
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
            />
          )}
          <Input
            label="Notes (optional)"
            placeholder="Partial payment, etc."
            value={payNotes}
            onChange={e => setPayNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowPayModal(false)}>Cancel</Button>
            <Button type="submit" fullWidth loading={payMutation.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Settlement Modal */}
      <Modal open={showSettleModal} onClose={() => { setShowSettleModal(false); setSettleError(''); }} title="Record Settlement">
        <form onSubmit={handleSettleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500">Settlements (goods return, credit note, discount) reduce the due amount on this bill.</p>
          <Select
            label="Settlement Type"
            required
            value={settleType}
            onChange={e => setSettleType(e.target.value as SettlementType)}
            options={SETTLEMENT_TYPES}
          />
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            min={0.01}
            required
            value={settleAmount}
            onChange={e => setSettleAmount(e.target.value)}
            hint={`Due: ₹${bill.dueAmount.toLocaleString('en-IN')}`}
            error={settleError}
          />
          <Input
            label="Notes (optional)"
            placeholder="Reason for settlement..."
            value={settleNotes}
            onChange={e => setSettleNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <Button type="button" variant="outline" fullWidth onClick={() => setShowSettleModal(false)}>Cancel</Button>
            <Button type="submit" fullWidth loading={settleMutation.isPending}>Record Settlement</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AmountBox({ label, amount, color }: { label: string; amount: number; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-2.5 text-center ${colors[color] ?? colors.slate}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-bold text-sm">₹{amount.toLocaleString('en-IN')}</div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className={`text-right ${highlight === 'red' ? 'text-red-600 font-medium' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

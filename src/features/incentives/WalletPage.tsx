import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, IndianRupee, Receipt, HandCoins } from 'lucide-react';
import { incentivesApi } from '@/api/incentives';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { EmptyState } from '@/components/feedback/EmptyState';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { type AxiosError } from 'axios';
import type { PaymentMode } from '@/types/api';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const MODES_WITH_REF: PaymentMode[] = ['CHEQUE', 'UPI', 'NEFT', 'BANK_TRANSFER'];

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WalletPage() {
  const { userId } = useParams<{ userId?: string }>();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();
  const [txPage, setTxPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const canPayout = isAdmin && !!userId;

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.get(userId!),
    select: r => r.data.data,
    enabled: !!userId,
  });

  const walletQuery = useQuery({
    queryKey: ['incentive-wallet', userId ?? 'me'],
    queryFn: () => userId ? incentivesApi.getWallet(userId) : incentivesApi.getMyWallet(),
    select: r => r.data.data,
  });

  const transactionsQuery = useQuery({
    queryKey: ['incentive-transactions', userId ?? 'me', txPage],
    queryFn: () => userId
      ? incentivesApi.getTransactions(userId, { page: txPage, limit: 10 })
      : incentivesApi.getMyTransactions({ page: txPage, limit: 10 }),
    select: r => r.data,
  });

  const payoutsQuery = useQuery({
    queryKey: ['incentive-payouts', userId ?? 'me', payoutPage],
    queryFn: () => userId
      ? incentivesApi.getPayouts(userId, { page: payoutPage, limit: 10 })
      : incentivesApi.getMyPayouts({ page: payoutPage, limit: 10 }),
    select: r => r.data,
  });

  if (walletQuery.isLoading) return <ListSkeleton />;
  if (walletQuery.isError) return <ErrorMessage onRetry={walletQuery.refetch} />;

  const wallet = walletQuery.data;
  if (!wallet) return null;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet size={22} className="text-blue-600" />
          {userId ? `${userQuery.data?.name ?? 'Employee'}'s Wallet` : 'My Incentive Wallet'}
        </h2>
        <p className="text-sm text-slate-400">Incentive rate: {wallet.rate}%</p>
      </div>

      {/* Balance summary */}
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-400">Available Balance</div>
            <div className="text-2xl font-bold text-emerald-600">{fmt(wallet.availableBalance)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Earned</div>
            <div className="text-lg font-semibold text-slate-800">{fmt(wallet.totalEarned)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Paid Out</div>
            <div className="text-lg font-semibold text-slate-800">{fmt(wallet.totalPaidOut)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">This Month</div>
            <div className="text-lg font-semibold text-slate-800">{fmt(wallet.currentMonthEarned)}</div>
          </div>
        </div>

        {canPayout && (
          <Button
            fullWidth
            className="mt-4"
            disabled={wallet.availableBalance <= 0}
            onClick={async () => { await walletQuery.refetch(); setShowPayoutModal(true); }}
          >
            <HandCoins size={16} /> Record Payout
          </Button>
        )}
      </Card>

      {/* Monthly breakdown */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <TrendingUp size={15} /> Monthly Breakdown
        </h3>
        {wallet.monthly.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No earnings yet</div>
        ) : (
          <div className="space-y-2">
            {wallet.monthly.map(m => (
              <div key={`${m.year}-${m.month}`} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-800">{dayjs(`${m.year}-${m.month}-01`).format('MMMM YYYY')}</div>
                  <div className="text-xs text-slate-400">{m.transactions} txn · collected {fmt(m.baseCollected)}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-600">{fmt(m.earned)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Transactions */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <IndianRupee size={15} /> Incentive Transactions
        </h3>
        {transactionsQuery.isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : !transactionsQuery.data?.data.length ? (
          <EmptyState icon={<IndianRupee size={32} />} title="No transactions yet" />
        ) : (
          <>
            <div className="space-y-2">
              {transactionsQuery.data.data.map(t => (
                <div key={t.id} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-800">{t.payment.bill.chemist.shopName}</div>
                    <div className="text-sm font-semibold text-emerald-600">+{fmt(t.amount)}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Bill {t.payment.bill.billNumber} · {fmt(t.baseAmount)} @ {t.rate}% · {dayjs(t.createdAt).format('D MMM YYYY')}
                  </div>
                </div>
              ))}
            </div>
            {transactionsQuery.data.meta.totalPages > 1 && (
              <Pagination page={txPage} totalPages={transactionsQuery.data.meta.totalPages} onChange={setTxPage} />
            )}
          </>
        )}
      </Card>

      {/* Payouts */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Receipt size={15} /> Payout History
        </h3>
        {payoutsQuery.isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : !payoutsQuery.data?.data.length ? (
          <EmptyState icon={<Receipt size={32} />} title="No payouts yet" />
        ) : (
          <>
            <div className="space-y-2">
              {payoutsQuery.data.data.map(p => (
                <div key={p.id} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-800">{fmt(p.amount)}</div>
                    <Badge>{PAYMENT_MODES.find(m => m.value === p.paymentMode)?.label ?? p.paymentMode}</Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {dayjs(p.createdAt).format('D MMM YYYY, h:mm A')}
                    {p.referenceNumber && ` · Ref: ${p.referenceNumber}`}
                    {p.paidBy && ` · by ${p.paidBy.name}`}
                  </div>
                  {p.notes && <div className="text-xs text-slate-400 mt-0.5">{p.notes}</div>}
                </div>
              ))}
            </div>
            {payoutsQuery.data.meta.totalPages > 1 && (
              <Pagination page={payoutPage} totalPages={payoutsQuery.data.meta.totalPages} onChange={setPayoutPage} />
            )}
          </>
        )}
      </Card>

      {canPayout && (
        <PayoutModal
          open={showPayoutModal}
          userId={userId!}
          availableBalance={wallet.availableBalance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false);
            qc.invalidateQueries({ queryKey: ['incentive-wallet', userId] });
            qc.invalidateQueries({ queryKey: ['incentive-payouts', userId] });
          }}
        />
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between mt-3">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
      <span className="text-sm text-slate-500">{page}/{totalPages}</span>
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Next</Button>
    </div>
  );
}

function PayoutModal({
  open, userId, availableBalance, onClose, onSuccess,
}: {
  open: boolean;
  userId: string;
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => incentivesApi.createPayout(userId, {
      amount: Number(amount),
      paymentMode: mode,
      referenceNumber: reference || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      toast.success('Payout recorded');
      handleClose();
      onSuccess();
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      setError(err.response?.data?.error?.message || 'Failed to record payout');
    },
  });

  const handleClose = () => {
    setAmount(''); setMode('CASH'); setReference(''); setNotes(''); setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) { setError('Enter a valid amount'); return; }
    if (value > availableBalance) { setError(`Amount exceeds available balance of ${fmt(availableBalance)}`); return; }
    setError('');
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Record Payout">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amount (₹)"
          type="number"
          step="0.01"
          min={0}
          required
          value={amount}
          onChange={e => setAmount(e.target.value)}
          hint={`Available: ${fmt(availableBalance)} — enter less for a partial payout`}
          error={error}
        />
        <Select
          label="Payment Mode"
          required
          value={mode}
          onChange={e => setMode(e.target.value as PaymentMode)}
          options={PAYMENT_MODES}
        />
        {MODES_WITH_REF.includes(mode) && (
          <Input
            label="Reference Number"
            placeholder="Cheque no / UPI ref / NEFT ref"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        )}
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <p className="text-xs text-slate-400">This action is final — there's no way to undo a payout once recorded.</p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" fullWidth onClick={handleClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={mutation.isPending}>Confirm Payout</Button>
        </div>
      </form>
    </Modal>
  );
}

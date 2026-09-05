import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { incentivesApi } from '@/api/incentives';

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

export function WalletBadge() {
  const { data: wallet } = useQuery({
    queryKey: ['incentive-wallet', 'me'],
    queryFn: () => incentivesApi.getMyWallet(),
    select: r => r.data.data,
    staleTime: 60_000,
  });

  return (
    <Link
      to="/wallet"
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-slate-100"
      aria-label={`Wallet — available balance ₹${(wallet?.availableBalance ?? 0).toLocaleString('en-IN')}`}
    >
      <Wallet size={18} className="text-slate-500" />
      <span className="text-sm font-semibold text-slate-700">
        ₹{compact.format(wallet?.availableBalance ?? 0)}
      </span>
    </Link>
  );
}

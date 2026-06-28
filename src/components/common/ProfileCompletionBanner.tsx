import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCog, ChevronRight, X } from 'lucide-react';
import { useMyProfile } from '@/hooks/useMyProfile';

const DISMISS_KEY = 'profile-complete-dismissed-at';
const DISMISS_DAYS = 1;

function recentlyDismissed(): boolean {
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Soft, dismissible nudge to finish the profile (photo + KYC). Never blocks the
 * app — just links to Settings. Hidden on the Settings page itself and once the
 * profile is complete. Shares the `me` query cache with the Settings page.
 */
export function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile } = useMyProfile();
  const [dismissed, setDismissed] = useState(recentlyDismissed());

  if (dismissed || location.pathname === '/settings') return null;
  if (!profile || profile.profileComplete) return null;

  const count = profile.missingProfileFields?.length ?? 0;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 py-2 pl-2 pr-1">
        <button onClick={() => navigate('/settings')} className="flex flex-1 items-center gap-3 min-w-0 px-2 py-1 text-left">
          <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <UserCog size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-blue-900">Complete your profile</span>
            <span className="block text-xs text-blue-700/80 truncate">
              {count} {count === 1 ? 'item' : 'items'} left — add your photo &amp; documents
            </span>
          </span>
          <ChevronRight size={16} className="flex-shrink-0 text-blue-400" />
        </button>
        <button onClick={dismiss} aria-label="Dismiss" className="flex-shrink-0 p-2 text-blue-400 hover:text-blue-700">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

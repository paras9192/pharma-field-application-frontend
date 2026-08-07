import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import srlLogo from '@/assets/logo.png';
import { useInstallPrompt } from '@/pwa/useInstallPrompt';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 7;

function recentlyDismissed(): boolean {
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Floating install banner. Dismissing it hides the banner for a week, but never
 * hides the permanent "Install app" row in Settings — that stays the reliable
 * way in for anyone who dismissed this or is on a browser that never offers it.
 */
export function InstallPrompt() {
  const { canInstall, needsIOSInstructions, install } = useInstallPrompt();
  // Read once on mount: re-reading every render would let the banner reappear
  // mid-session after the dismissal is written.
  const [snoozed, setSnoozed] = useState(recentlyDismissed);

  const handleInstall = async () => {
    await install();
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setSnoozed(true);
  };

  if (snoozed) return null;
  if (!canInstall && !needsIOSInstructions) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3">
        <img src={srlLogo} alt="SRL PULSE" className="h-12 w-12 object-contain flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm">Install SRL PULSE</div>
          {needsIOSInstructions ? (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
              Tap <Share size={13} className="inline text-blue-500" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">Add to your home screen for quick access</p>
          )}
        </div>

        {canInstall && (
          <button
            onClick={handleInstall}
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-colors"
          >
            <Download size={15} /> Install
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

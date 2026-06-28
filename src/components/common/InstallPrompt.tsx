import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import srlLogo from '@/assets/logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 7;

function recentlyDismissed(): boolean {
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  const ageMs = Date.now() - Number(at);
  return ageMs < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Chrome / Edge / Android: capture the browser's install event so we can
    // trigger it from our own button instead of relying on the (mostly hidden)
    // native UI.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS Safari never fires beforeinstallprompt — show manual instructions.
    if (isIOS()) setShowIOS(true);

    const onInstalled = () => {
      setDeferred(null);
      setShowIOS(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!deferred && !showIOS) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3">
        <img src={srlLogo} alt="SRL PULSE" className="h-12 w-12 object-contain flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm">Install SRL PULSE</div>
          {showIOS ? (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
              Tap <Share size={13} className="inline text-blue-500" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">Add to your home screen for quick access</p>
          )}
        </div>

        {!showIOS && (
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

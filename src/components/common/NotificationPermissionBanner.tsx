import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { enablePushNotifications, pushSupported } from '@/hooks/usePushNotifications';

/**
 * Slim, dismissible nudge (not a blocking modal) shown every login while
 * Notification permission isn't 'granted'. The click is required — browsers
 * refuse to show the native Allow/Block dialog without a real user gesture,
 * so this banner exists purely to be the thing the user clicks.
 */
export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission !== 'granted') {
      setBlocked(Notification.permission === 'denied');
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const result = await enablePushNotifications();
      setBlocked(result === 'denied');
      if (result === 'granted') {
        setVisible(false);
        toast.success('Notifications enabled');
      }
    } catch (err) {
      console.error('[push] enable failed:', err);
      toast.error('Permission granted, but saving your device failed — check the console');
      setVisible(false);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 py-2 pl-2 pr-1">
        <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <BellRing size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-amber-900">Turn on notifications</span>
          <span className="block text-xs text-amber-700/80 truncate">
            {blocked
              ? 'Blocked — enable via the site settings in your browser, then reload'
              : 'Get alerts for leave approvals, attendance and more'}
          </span>
        </span>
        {!blocked && (
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {requesting ? 'Requesting…' : 'Allow'}
          </button>
        )}
        <button onClick={() => setVisible(false)} aria-label="Dismiss" className="flex-shrink-0 p-2 text-amber-400 hover:text-amber-700">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

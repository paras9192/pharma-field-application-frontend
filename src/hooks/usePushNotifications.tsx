import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase';
import { notificationsApi } from '@/api/notifications';
import { getNotificationLink } from '@/features/notifications/notificationMeta';
import { PushToast } from '@/features/notifications/PushToast';
import type { NotificationType } from '@/types/api';
import toast from 'react-hot-toast';

const FCM_TOKEN_KEY = 'fcm_token';

export async function removeFcmToken() {
  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token) return;
  try {
    await notificationsApi.removeFcmToken(token);
  } catch { /* ignore — best effort */ }
  localStorage.removeItem(FCM_TOKEN_KEY);
}

export const pushSupported = () =>
  'Notification' in window && 'serviceWorker' in navigator && !!import.meta.env.VITE_FIREBASE_API_KEY;

async function registerAndSaveToken(isCancelled: () => boolean = () => false) {
  const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;
  if (isCancelled()) return;

  const token = await requestFCMToken(swReg);
  if (!token) {
    console.warn('[push] no FCM token — see requestFCMToken error above (if any)');
    return;
  }
  if (isCancelled()) return;

  localStorage.setItem(FCM_TOKEN_KEY, token);
  try {
    await notificationsApi.saveFcmToken(token, navigator.userAgent);
  } catch (err) {
    console.error('[push] saveFcmToken API call failed:', err);
    throw err;
  }
}

/**
 * Shows the browser's native Allow/Block dialog. Chrome (and other modern
 * browsers) silently refuse to show this unless it's called from inside a
 * real user gesture (a click) — calling it from a useEffect on page load
 * does nothing and leaves permission stuck on 'default' forever. Must be
 * wired to an onClick.
 */
export async function enablePushNotifications(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    await registerAndSaveToken();
  }
  return permission;
}

export function usePushNotifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!pushSupported()) return;

    // StrictMode mounts every effect twice in dev (mount → cleanup →
    // remount) to surface exactly this kind of bug: without this guard the
    // stale first invocation's fetch completes anyway, firing the save
    // request twice. Checking `cancelled` before each async step lets the
    // torn-down invocation bail out once cleanup has run.
    let cancelled = false;

    // Only silently (re)register when permission is already granted — asking
    // for it requires a user gesture, see enablePushNotifications() above.
    if (Notification.permission === 'granted') {
      registerAndSaveToken(() => cancelled).catch(err => console.error('[push] silent re-register failed:', err));
    }

    // Handle foreground messages: show a toast + refresh the notification list
    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'New notification';
      const body = payload.notification?.body;
      const type = payload.data?.type as NotificationType | undefined;
      const link = getNotificationLink({ type: type ?? 'GENERAL', data: payload.data ?? null });

      toast.custom(
        t => <PushToast t={t} title={title} body={body} type={type} onClick={() => navigate(link)} />,
        { duration: 6000, position: 'top-right' }
      );
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [qc, navigate]);
}

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase';
import { notificationsApi } from '@/api/notifications';
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

export function usePushNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (!import.meta.env.VITE_FIREBASE_API_KEY) return;

    let cancelled = false;

    async function setup() {
      try {
        // Register the Firebase messaging SW
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const permission = await Notification.requestPermission();
        if (permission !== 'granted' || cancelled) return;

        const token = await requestFCMToken();
        if (!token || cancelled) return;

        localStorage.setItem(FCM_TOKEN_KEY, token);
        await notificationsApi.saveFcmToken(token);
      } catch {
        // Push setup is non-critical — silently skip
      }
    }

    setup();

    // Handle foreground messages: show toast + refresh notification list
    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'New notification';
      const body = payload.notification?.body;
      toast(body ? `${title}\n${body}` : title, { duration: 5000 });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [qc]);
}

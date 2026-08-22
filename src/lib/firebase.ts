import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload, type Messaging } from 'firebase/messaging';

// Single source of truth for the Firebase web config — read once from
// .env.local. The service worker (public/firebase-messaging-sw.js) can't
// read import.meta.env itself since Vite serves it untouched, so these same
// values are also passed to it as URL query params at registration time
// (see getMessagingSwUrl below) instead of being duplicated in that file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function getMessagingSwUrl(): string {
  const params = new URLSearchParams(firebaseConfig as Record<string, string>);
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;

  if (getApps().length > 0) return getApps()[0];

  return initializeApp(firebaseConfig);
}

function getFirebaseMessaging(): Messaging | null {
  try {
    const app = getFirebaseApp();
    return app ? getMessaging(app) : null;
  } catch {
    return null;
  }
}

export async function requestFCMToken(swReg?: ServiceWorkerRegistration): Promise<string | null> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    swReg ??= await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch (err) {
    console.error('[push] requestFCMToken failed:', err);
    return null;
  }
}

export function onForegroundMessage(handler: (payload: MessagePayload) => void): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type MessagePayload, type Messaging } from 'firebase/messaging';

function getFirebaseApp(): FirebaseApp | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;

  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

function getFirebaseMessaging(): Messaging | null {
  try {
    const app = getFirebaseApp();
    return app ? getMessaging(app) : null;
  } catch {
    return null;
  }
}

export async function requestFCMToken(): Promise<string | null> {
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch {
    return null;
  }
}

export function onForegroundMessage(handler: (payload: MessagePayload) => void): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}

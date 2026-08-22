// Firebase Messaging Service Worker
// Replace the config below with your Firebase project config after setup.
// These values are safe to commit — they are public identifiers, not secrets.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAdCJkSh4V5sHvP0KEM7ozPOZL6SGOiFHo',
  authDomain: 'pharma-field.firebaseapp.com',
  projectId: 'pharma-field',
  storageBucket: 'pharma-field.firebasestorage.app',
  messagingSenderId: '967883708135',
  appId: '1:967883708135:web:852efdffcb1a43db303442',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'PharmaField';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

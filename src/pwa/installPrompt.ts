/**
 * Captures the browser's install event before React ever renders.
 *
 * Chrome fires `beforeinstallprompt` as soon as it decides the app is
 * installable, which is routinely *before* React has mounted and run its
 * effects. The event is not replayed and cannot be re-requested, so a listener
 * registered inside a component's `useEffect` misses it on most loads and the
 * install button never appears. This module is imported for its side effect at
 * the top of main.tsx so the listener is live from the first line of app code.
 *
 * Components read the captured event through `subscribe` / `getInstallPrompt`
 * (see `useInstallPrompt`), so it does not matter whether they mount before or
 * after the browser fires.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Suppress Chrome's own mini-infobar so the in-app button is the only entry
    // point; without this the event still fires but the browser owns the UI.
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The captured event, or null when the browser has not offered an install. */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

/** Server snapshot for useSyncExternalStore — never installable while rendering. */
export function getServerInstallPrompt(): BeforeInstallPromptEvent | null {
  return null;
}

/**
 * Shows the native install dialog. The captured event is single-use: once
 * prompted it is cleared, and the browser will fire a fresh one later if the
 * user declines and the app still qualifies.
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const event = deferred;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  emit();
  return outcome;
}

/** Already running as an installed app, so there is nothing to offer. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari predates display-mode and exposes its own flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * iOS Safari never fires `beforeinstallprompt` and offers no programmatic
 * install, so those users get manual "Add to Home Screen" instructions instead
 * of a button that cannot work.
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

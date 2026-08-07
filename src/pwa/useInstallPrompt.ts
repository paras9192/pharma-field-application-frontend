import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getInstallPrompt,
  getServerInstallPrompt,
  promptInstall,
  isIOS,
  isStandalone,
} from './installPrompt';

export interface InstallState {
  /** Chrome/Edge/Android: the native dialog is available right now. */
  canInstall: boolean;
  /** iOS Safari: no programmatic install, show Add to Home Screen steps. */
  needsIOSInstructions: boolean;
  /** Already installed — callers should render nothing. */
  installed: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

/**
 * Subscribes to the install event captured in installPrompt.ts. Because that
 * module listens from app start, this returns the right answer whether the
 * browser fired before or after the component mounted.
 */
export function useInstallPrompt(): InstallState {
  const deferred = useSyncExternalStore(subscribe, getInstallPrompt, getServerInstallPrompt);
  const installed = isStandalone();

  return {
    canInstall: !installed && deferred !== null,
    needsIOSInstructions: !installed && deferred === null && isIOS(),
    installed,
    install: promptInstall,
  };
}

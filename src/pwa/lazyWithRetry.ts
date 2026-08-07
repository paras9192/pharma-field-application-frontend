import { lazy, type ComponentType } from 'react';

/**
 * Survives a deploy that lands while the app is open.
 *
 * Every route is code-split, so navigating fetches a chunk whose filename
 * carries a content hash (DashboardPage-_VuCWqix.js). A deploy publishes new
 * hashes and deletes the old files, so a tab still running the previous build —
 * or holding a cached index.html — requests a chunk that now 404s, and React
 * throws "Failed to fetch dynamically imported module". The page is simply
 * stale: reloading fetches the current index.html and its correct chunk names.
 *
 * The reload is attempted once per session. If the import fails again after the
 * reload the problem is not staleness (offline, or a genuinely broken deploy),
 * so the error is rethrown and the ErrorBoundary shows it rather than putting
 * the app in a refresh loop.
 */
const RELOAD_KEY = 'chunk-reload-attempted';

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await factory();
      // Loaded fine, so clear the guard — the next deploy gets a fresh attempt.
      sessionStorage.removeItem(RELOAD_KEY);
      return module;
    } catch (error) {
      if (sessionStorage.getItem(RELOAD_KEY)) throw error;

      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();

      // The page is being replaced; never resolve, so React does not render a
      // fallback or surface the error during the tear-down.
      return new Promise<never>(() => {});
    }
  });
}

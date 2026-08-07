import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lazyWithRetry } from '@/pwa/lazyWithRetry';

/**
 * Reaches into the lazy component's internal loader so the retry logic can be
 * exercised without mounting React. `_payload._result` is the factory React
 * calls on first render.
 */
function loaderOf(component: ReturnType<typeof lazyWithRetry>) {
  return (component as unknown as { _payload: { _result: () => Promise<unknown> } })._payload._result;
}

const RELOAD_KEY = 'chunk-reload-attempted';

describe('lazyWithRetry', () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
  });

  it('returns the module when the import succeeds', async () => {
    const Component = () => null;
    const lazyComponent = lazyWithRetry(async () => ({ default: Component }));

    await expect(loaderOf(lazyComponent)()).resolves.toEqual({ default: Component });
    expect(reload).not.toHaveBeenCalled();
  });

  // A deploy replaced the hashed chunk this build points at, so the running page
  // is stale and a reload picks up the new index.html.
  it('reloads once when a chunk 404s after a deploy', async () => {
    const lazyComponent = lazyWithRetry(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module')),
    );

    // Never settles: the page is being torn down by the reload.
    const pending = loaderOf(lazyComponent)();
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

    expect(sessionStorage.getItem(RELOAD_KEY)).toBe('1');
    expect(pending).toBeInstanceOf(Promise);
  });

  // Reloading did not help, so this is not staleness — surface it to the
  // ErrorBoundary instead of reloading forever.
  it('rethrows instead of looping when it already reloaded', async () => {
    sessionStorage.setItem(RELOAD_KEY, '1');
    const failure = new Error('Failed to fetch dynamically imported module');
    const lazyComponent = lazyWithRetry(() => Promise.reject(failure));

    await expect(loaderOf(lazyComponent)()).rejects.toThrow(failure);
    expect(reload).not.toHaveBeenCalled();
  });

  // Otherwise the very next deploy would find the guard still set and skip its
  // one legitimate reload.
  it('clears the guard after a successful load', async () => {
    sessionStorage.setItem(RELOAD_KEY, '1');
    const lazyComponent = lazyWithRetry(async () => ({ default: () => null }));

    await loaderOf(lazyComponent)();

    expect(sessionStorage.getItem(RELOAD_KEY)).toBeNull();
  });
});

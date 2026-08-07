import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type AxiosInstance } from 'axios';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeAxiosError(status: number, config: Record<string, unknown> = {}) {
  const err = new Error('Request failed') as Error & {
    isAxiosError: boolean;
    response: { status: number };
    config: Record<string, unknown>;
  };
  err.isAxiosError = true;
  err.response = { status };
  err.config = { headers: {}, ...config };
  return err;
}


// ── interceptor access ────────────────────────────────────────────────────────

// The handler arrays are internal to axios and carry no public types. Reaching in
// through these two helpers keeps the cast in one place and, unlike suppressing
// the error at each call site, leaves the calls themselves type-checked.
interface TestRequestConfig {
  headers: Record<string, string>;
  url: string;
}

function requestHandler(api: AxiosInstance) {
  return (
    api.interceptors.request as unknown as {
      handlers: { fulfilled: (config: TestRequestConfig) => Promise<TestRequestConfig> }[];
    }
  ).handlers[0];
}

function responseHandler(api: AxiosInstance) {
  return (
    api.interceptors.response as unknown as {
      handlers: { rejected: (error: unknown) => Promise<unknown> }[];
    }
  ).handlers[0];
}

// ── module setup ──────────────────────────────────────────────────────────────

// We mock axios.post *before* importing the module so the interceptor picks up
// the mock version.
const mockAxiosPost = vi.fn();
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: actual.default.create,
      post: (...args: unknown[]) => mockAxiosPost(...args),
    },
  };
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Axios 401 interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Spy on location so tests don't actually navigate
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches Authorization header when token is in localStorage', async () => {
    localStorage.setItem('accessToken', 'my-token');
    const { api } = await import('@/api/axios');

    // Peek at the interceptor list to confirm the request interceptor runs
    // We can't call the real server; just verify the config is mutated.
    const config = { headers: {} as Record<string, string>, url: '/test' };
    const handler = requestHandler(api);
    const result = await handler.fulfilled(config);
    expect(result.headers['Authorization']).toBe('Bearer my-token');
  });

  it('does NOT attach Authorization header when no token exists', async () => {
    localStorage.removeItem('accessToken');
    const { api } = await import('@/api/axios');

    const config = { headers: {} as Record<string, string>, url: '/test' };
    const handler = requestHandler(api);
    const result = await handler.fulfilled(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('redirects to /login immediately when 401 and no refresh token', async () => {
    localStorage.removeItem('refreshToken');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401);
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('calls refresh endpoint and stores new tokens on 401 with refresh token', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    localStorage.setItem('accessToken', 'old-access');

    mockAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'new-access', refreshToken: 'new-refresh' } },
    });

    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401);
    const handler = responseHandler(api);

    // The retry will fail with a network error in jsdom (no real server),
    // but the important assertions are that refresh was called and tokens updated.
    try {
      await handler.rejected(error);
    } catch {
      // expected: retry hits network error in test environment
    }

    // Must call refresh WITH an explicit timeout — otherwise an unreachable
    // server hangs the refresh forever and the UI gets stuck loading.
    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      { refreshToken: 'old-refresh' },
      expect.objectContaining({ timeout: expect.any(Number) })
    );
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('redirects to /login and clears persisted auth store when refresh fails', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    // Simulate a logged-in persisted store; the guard would bounce back to /
    // and re-loop unless this is cleared too.
    localStorage.setItem('pharma-auth', JSON.stringify({ state: { isAuthenticated: true } }));
    mockAxiosPost.mockRejectedValueOnce(new Error('Refresh failed'));

    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401);
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    // Persisted store must be wiped so the route guard does not loop.
    expect(localStorage.getItem('pharma-auth')).toBeNull();
  });

  it('does NOT retry on 401 if _retry is already true (prevents infinite loop)', async () => {
    localStorage.setItem('refreshToken', 'some-refresh');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401, { _retry: true });
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    // Refresh endpoint must NOT be called
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('passes non-401 errors through without touching tokens', async () => {
    localStorage.setItem('accessToken', 'some-token');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(500);
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBe('some-token');
  });

  it('does NOT redirect on a 401 from /auth/login (wrong credentials show inline error)', async () => {
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401, { url: '/auth/login' });
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    // Must NOT trigger refresh or a hard redirect — the form handles it
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  it('does NOT loop on a 401 from /auth/refresh', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401, { url: '/auth/refresh' });
    const handler = responseHandler(api);

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });
});

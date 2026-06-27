import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

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

// ── module setup ──────────────────────────────────────────────────────────────

// We mock axios.post *before* importing the module so the interceptor picks up
// the mock version.
const mockAxiosPost = vi.fn();
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof axios>();
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
  let deleteOrig: typeof localStorage.removeItem;

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
    if (deleteOrig) localStorage.removeItem = deleteOrig;
  });

  it('attaches Authorization header when token is in localStorage', async () => {
    localStorage.setItem('accessToken', 'my-token');
    const { api } = await import('@/api/axios');

    // Peek at the interceptor list to confirm the request interceptor runs
    // We can't call the real server; just verify the config is mutated.
    const config = { headers: {} as Record<string, string>, url: '/test' };
    // @ts-expect-error – accessing private handler array for testing
    const handler = api.interceptors.request.handlers[0];
    const result = await handler.fulfilled(config);
    expect(result.headers['Authorization']).toBe('Bearer my-token');
  });

  it('does NOT attach Authorization header when no token exists', async () => {
    localStorage.removeItem('accessToken');
    const { api } = await import('@/api/axios');

    const config = { headers: {} as Record<string, string>, url: '/test' };
    // @ts-expect-error – accessing private handler array for testing
    const handler = api.interceptors.request.handlers[0];
    const result = await handler.fulfilled(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('redirects to /login immediately when 401 and no refresh token', async () => {
    localStorage.removeItem('refreshToken');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401);
    // @ts-expect-error – accessing private handler
    const handler = api.interceptors.response.handlers[0];

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
    // @ts-expect-error – accessing private handler
    const handler = api.interceptors.response.handlers[0];

    // The retry will fail with a network error in jsdom (no real server),
    // but the important assertions are that refresh was called and tokens updated.
    try {
      await handler.rejected(error);
    } catch {
      // expected: retry hits network error in test environment
    }

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      { refreshToken: 'old-refresh' }
    );
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('redirects to /login when refresh call fails', async () => {
    localStorage.setItem('refreshToken', 'old-refresh');
    mockAxiosPost.mockRejectedValueOnce(new Error('Refresh failed'));

    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401);
    // @ts-expect-error – accessing private handler
    const handler = api.interceptors.response.handlers[0];

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(window.location.href).toBe('/login');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('does NOT retry on 401 if _retry is already true (prevents infinite loop)', async () => {
    localStorage.setItem('refreshToken', 'some-refresh');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(401, { _retry: true });
    // @ts-expect-error – accessing private handler
    const handler = api.interceptors.response.handlers[0];

    await expect(handler.rejected(error)).rejects.toBeDefined();
    // Refresh endpoint must NOT be called
    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('passes non-401 errors through without touching tokens', async () => {
    localStorage.setItem('accessToken', 'some-token');
    const { api } = await import('@/api/axios');

    const error = makeAxiosError(500);
    // @ts-expect-error – accessing private handler
    const handler = api.interceptors.response.handlers[0];

    await expect(handler.rejected(error)).rejects.toBeDefined();
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBe('some-token');
  });
});

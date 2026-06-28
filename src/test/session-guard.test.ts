import { describe, it, expect } from 'vitest';
import { hasActiveSession } from '@/routes/ProtectedRoute';

describe('hasActiveSession', () => {
  it('is true only when authenticated AND a token is present', () => {
    expect(hasActiveSession(true, 'token-123')).toBe(true);
  });

  it('is false when there is no token, even if isAuthenticated is true (stale flag)', () => {
    // This is the exact bug: persisted isAuthenticated=true but the token is gone.
    // The guard must send the user to login instead of loading forever.
    expect(hasActiveSession(true, null)).toBe(false);
    expect(hasActiveSession(true, '')).toBe(false);
  });

  it('is false when not authenticated', () => {
    expect(hasActiveSession(false, 'token-123')).toBe(false);
    expect(hasActiveSession(false, null)).toBe(false);
  });
});

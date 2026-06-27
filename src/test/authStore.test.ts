import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import type { AuthUser, Role } from '@/types/api';

function makeUser(role: Role): AuthUser {
  return { id: '1', name: 'Test', email: 'test@test.com', role, isActive: true };
}

beforeEach(() => {
  // Reset store to initial state between tests
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  localStorage.clear();
});

describe('setAuth', () => {
  it('sets user, tokens and isAuthenticated', () => {
    useAuthStore.getState().setAuth({
      user: makeUser('ADMIN'),
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe('ADMIN');
    expect(state.accessToken).toBe('access-123');
    expect(localStorage.getItem('accessToken')).toBe('access-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
  });
});

describe('logout', () => {
  it('clears all auth state and localStorage tokens', () => {
    useAuthStore.getState().setAuth({
      user: makeUser('ADMIN'),
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('isAdmin', () => {
  it('returns true for SUPER_ADMIN', () => {
    useAuthStore.setState({ user: makeUser('SUPER_ADMIN') });
    expect(useAuthStore.getState().isAdmin()).toBe(true);
  });

  it('returns true for ADMIN', () => {
    useAuthStore.setState({ user: makeUser('ADMIN') });
    expect(useAuthStore.getState().isAdmin()).toBe(true);
  });

  it.each(['MR', 'ASM', 'ZSM', 'SALES_PERSON'] as Role[])('returns false for %s', (role) => {
    useAuthStore.setState({ user: makeUser(role) });
    expect(useAuthStore.getState().isAdmin()).toBe(false);
  });

  it('returns false when no user', () => {
    expect(useAuthStore.getState().isAdmin()).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('returns true only for SUPER_ADMIN', () => {
    useAuthStore.setState({ user: makeUser('SUPER_ADMIN') });
    expect(useAuthStore.getState().isSuperAdmin()).toBe(true);
  });

  it('returns false for ADMIN', () => {
    useAuthStore.setState({ user: makeUser('ADMIN') });
    expect(useAuthStore.getState().isSuperAdmin()).toBe(false);
  });
});

describe('isField', () => {
  it.each(['MR', 'SALES_PERSON'] as Role[])('returns true for %s', (role) => {
    useAuthStore.setState({ user: makeUser(role) });
    expect(useAuthStore.getState().isField()).toBe(true);
  });

  it.each(['SUPER_ADMIN', 'ADMIN', 'ASM', 'ZSM'] as Role[])('returns false for %s', (role) => {
    useAuthStore.setState({ user: makeUser(role) });
    expect(useAuthStore.getState().isField()).toBe(false);
  });
});

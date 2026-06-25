import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Role } from '@/types/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isField: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      isAdmin: () => {
        const role = get().user?.role;
        return role === 'SUPER_ADMIN' || role === 'ADMIN';
      },

      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',

      isField: () => {
        const role = get().user?.role as Role | undefined;
        return role === 'MR' || role === 'ASM' || role === 'ZSM' || role === 'SALES_PERSON';
      },
    }),
    {
      name: 'pharma-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

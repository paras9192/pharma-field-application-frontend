import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken } from '@/api/axios';

/**
 * A persisted `isAuthenticated` flag is NOT enough to consider a user logged in —
 * the actual access token may be gone (cleared by the interceptor, expired and
 * wiped, or removed manually). Without a token every request 401s and the app
 * would otherwise sit on an infinite loading screen. Require both, and when the
 * token is missing send the user straight to /login.
 */
export function hasActiveSession(isAuthenticated: boolean, token: string | null): boolean {
  return isAuthenticated && !!token;
}

function useActiveSession(): boolean {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return hasActiveSession(isAuthenticated, getAccessToken());
}

export function ProtectedRoute() {
  const loggedIn = useActiveSession();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const loggedIn = useActiveSession();
  const isAdmin = useAuthStore(s => s.isAdmin());
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const loggedIn = useActiveSession();
  if (loggedIn) return <Navigate to="/" replace />;
  return <Outlet />;
}

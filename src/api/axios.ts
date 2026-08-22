import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// The localhost default only makes sense for local dev. A production build
// (Amplify) with this var missing or misnamed must fail loudly at load time
// instead of silently shipping a bundle that points every user's browser at
// their own localhost:3000.
function requireApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (url) return url;
  if (import.meta.env.DEV) return 'http://localhost:3000';
  throw new Error('VITE_API_URL is not set — check the environment variables for this Amplify build.');
}

export const BACKEND_ORIGIN = requireApiUrl();
const BASE_URL = BACKEND_ORIGIN + '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// File uploads need far longer than the default 10s — a multi-MB photo on a
// mobile data connection can take 30s+. Matches the backend's 60s upload window.
export const UPLOAD_TIMEOUT = 60000;

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Also wipe the persisted auth store, otherwise `isAuthenticated` stays true
  // and the route guard bounces /login -> / -> 401 -> /login in a reload loop.
  localStorage.removeItem('pharma-auth');
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints handle their own 401s (e.g. wrong login credentials).
// The session-refresh logic below must never run for them, otherwise a failed
// login would clear tokens and hard-redirect to /login (page reload) instead
// of letting the form show its error.
const isAuthRoute = (url?: string) =>
  !!url && (url.includes('/auth/login') || url.includes('/auth/refresh'));

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && !isAuthRoute(original.url)) {
      original._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Bare axios.post has NO timeout by default — without this, an
        // unreachable server makes the refresh hang forever and the original
        // request never settles, leaving the UI stuck on an infinite skeleton.
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { timeout: 10000 },
        );
        const { accessToken, refreshToken: newRefresh } = data.data;
        setTokens(accessToken, newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { getAccessToken, getRefreshToken, setTokens, clearTokens };

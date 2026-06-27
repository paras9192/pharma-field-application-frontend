import { useNavigate, useLocation } from 'react-router-dom';
import srlLogo from '@/assets/logo.png';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { authApi } from '@/api/auth';
import { removeFcmToken } from '@/hooks/usePushNotifications';
import { NotificationBell } from '@/features/notifications/NotificationPanel';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/attendance': 'Attendance',
  '/visits': 'Visits',
  '/visits/new': 'Log Visit',
  '/doctors': 'Doctors',
  '/doctors/new': 'Add Doctor',
  '/chemists': 'Chemists',
  '/chemists/new': 'Add Chemist',
  '/orders': 'Orders',
  '/orders/new': 'New Order',
  '/bills': 'Bills',
  '/bills/new': 'New Bill',
  '/payments': 'Payments',
  '/daily-reports': 'Daily Reports',
  '/users': 'Team',
  '/users/new': 'Add User',
  '/territories': 'Territories',
  '/settings': 'Settings',
};

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore(useShallow(s => ({
    user: s.user,
    logout: s.logout,
    refreshToken: s.refreshToken,
  })));

  const isRoot = ['/', '/attendance', '/visits', '/doctors', '/chemists', '/daily-reports', '/users', '/territories', '/settings'].includes(location.pathname);
  const title = routeTitles[location.pathname] || 'SRL PULSE';

  const handleLogout = async () => {
    await removeFcmToken();
    try { await authApi.logout(refreshToken ?? undefined); } catch { /* ignore */ }
    logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 lg:hidden">
      <div className={`flex items-center gap-3 px-4 ${isRoot ? 'h-20' : 'h-14'}`}>
        {!isRoot ? (
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-slate-100 -ml-1">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
        ) : (
          <img src={srlLogo} alt="SRL Life" className="h-16 w-auto object-contain" />
        )}

        {!isRoot && (
          <h1 className="flex-1 font-semibold text-slate-800 truncate">{title}</h1>
        )}

        <div className={`flex items-center gap-1 ${isRoot ? 'ml-auto' : ''}`}>
          <NotificationBell />
          <button
            onClick={() => navigate('/settings')}
            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm"
          >
            {user?.name?.[0]?.toUpperCase()}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

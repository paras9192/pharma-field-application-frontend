import { NavLink } from 'react-router-dom';
import srlLogo from '@/assets/logo.png';
import { Avatar } from '@/components/common/Avatar';
import {
  LayoutDashboard, Users, Stethoscope, Pill, MapPin, CalendarCheck,
  ClipboardList, FileText, LogOut, Settings, ShoppingCart, Receipt, IndianRupee, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { authApi } from '@/api/auth';

export function Sidebar() {
  const { user, isAdmin, logout, refreshToken } = useAuthStore(useShallow(s => ({
    user: s.user,
    isAdmin: s.isAdmin(),
    logout: s.logout,
    refreshToken: s.refreshToken,
  })));

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken ?? undefined); } catch { /* ignore */ }
    logout();
  };

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Team' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/visits', icon: ClipboardList, label: 'Visits' },
    { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/chemists', icon: Pill, label: 'Chemists' },
    // { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/bills', icon: Receipt, label: 'Bills' },
    { to: '/payments', icon: IndianRupee, label: 'Payments' },
    { to: '/dashboard/payments', icon: TrendingUp, label: 'Analytics' },
    { to: '/daily-reports', icon: FileText, label: 'Reports' },
    { to: '/territories', icon: MapPin, label: 'Territories' },
  ];

  const fieldLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/visits', icon: ClipboardList, label: 'Visits' },
    { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
    { to: '/chemists', icon: Pill, label: 'Chemists' },
    // { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/bills', icon: Receipt, label: 'Bills' },
    { to: '/payments', icon: IndianRupee, label: 'Payments' },
    { to: '/daily-reports', icon: FileText, label: 'Daily Reports' },
  ];

  const links = isAdmin ? adminLinks : fieldLinks;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="py-5 border-b border-slate-100 flex justify-center">
        <img src={srlLogo} alt="SRL Life" className="w-40 object-contain" />
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={user?.name} src={user?.profilePhoto} className="w-8 h-8 rounded-full text-sm flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-800 truncate">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

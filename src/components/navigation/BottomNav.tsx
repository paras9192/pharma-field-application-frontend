import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, ShoppingCart, Receipt, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function BottomNav() {
  const isAdmin = useAuthStore(s => s.isAdmin());

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Team' },
    { to: '/visits', icon: CalendarCheck, label: 'Visits' },
    // { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/bills', icon: Receipt, label: 'Bills' },
  ];

  const fieldLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/visits', icon: ClipboardList, label: 'Visits' },
    // { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/bills', icon: Receipt, label: 'Bills' },
  ];

  const links = isAdmin ? adminLinks : fieldLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-bottom lg:hidden">
      <div className="flex items-stretch">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors
              ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

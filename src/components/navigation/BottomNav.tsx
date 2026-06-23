import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, Pill, MapPin, CalendarCheck,
  ClipboardList, FileText, Receipt, IndianRupee, TrendingUp,
  MoreHorizontal, X, Settings, LogOut, UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { authApi } from '@/api/auth';

type NavItem = { to: string; icon: React.ElementType; label: string };

export function BottomNav() {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const { user, role, logout, refreshToken } = useAuthStore(useShallow(s => ({
    user: s.user,
    role: s.user?.role,
    logout: s.logout,
    refreshToken: s.refreshToken,
  })));

  const handleLogout = async () => {
    setShowMore(false);
    try { await authApi.logout(refreshToken ?? undefined); } catch { /* ignore */ }
    logout();
  };

  const handleMoreLink = (to: string) => {
    setShowMore(false);
    navigate(to);
  };

  // Primary 4 tabs per role (always visible)
  const primary: NavItem[] = (() => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/doctors',  icon: Stethoscope,     label: 'Doctors'  },
          { to: '/chemists', icon: Pill,            label: 'Chemists' },
          { to: '/visits',   icon: ClipboardList,   label: 'Visits'   },
        ];
      case 'MR':
        return [
          { to: '/',         icon: LayoutDashboard, label: 'Home'     },
          { to: '/doctors',  icon: Stethoscope,     label: 'Doctors'  },
          { to: '/chemists', icon: Pill,            label: 'Chemists' },
          { to: '/visits',   icon: ClipboardList,   label: 'Visits'   },
        ];
      case 'SALES_PERSON':
        return [
          { to: '/',         icon: LayoutDashboard, label: 'Home'     },
          { to: '/chemists', icon: Pill,            label: 'Chemists' },
          { to: '/visits',   icon: ClipboardList,   label: 'Visits'   },
          { to: '/bills',    icon: Receipt,         label: 'Bills'    },
        ];
      default:
        return [
          { to: '/',         icon: LayoutDashboard, label: 'Home'     },
          { to: '/visits',   icon: ClipboardList,   label: 'Visits'   },
          { to: '/doctors',  icon: Stethoscope,     label: 'Doctors'  },
          { to: '/chemists', icon: Pill,            label: 'Chemists' },
        ];
    }
  })();

  // All links in "More" sheet per role
  const moreLinks: NavItem[] = (() => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          { to: '/users',             icon: Users,          label: 'Team'        },
          { to: '/attendance',        icon: UserCheck,      label: 'Attendance'  },
          { to: '/bills',             icon: Receipt,        label: 'Bills'       },
          { to: '/payments',          icon: IndianRupee,    label: 'Payments'    },
          { to: '/dashboard/payments',icon: TrendingUp,     label: 'Analytics'   },
          { to: '/daily-reports',     icon: FileText,       label: 'Reports'     },
          { to: '/territories',       icon: MapPin,         label: 'Territories' },
          { to: '/settings',          icon: Settings,       label: 'Settings'    },
        ];
      case 'MR':
        return [
          { to: '/daily-reports', icon: FileText,    label: 'Reports'    },
          { to: '/attendance',    icon: UserCheck,   label: 'Attendance' },
          { to: '/bills',         icon: Receipt,     label: 'Bills'      },
          { to: '/payments',      icon: IndianRupee, label: 'Payments'   },
          { to: '/settings',      icon: Settings,    label: 'Settings'   },
        ];
      case 'SALES_PERSON':
        return [
          { to: '/doctors',       icon: Stethoscope, label: 'Doctors'    },
          { to: '/attendance',    icon: UserCheck,   label: 'Attendance' },
          { to: '/payments',      icon: IndianRupee, label: 'Payments'   },
          { to: '/daily-reports', icon: FileText,    label: 'Reports'    },
          { to: '/settings',      icon: Settings,    label: 'Settings'   },
        ];
      default:
        return [{ to: '/settings', icon: Settings, label: 'Settings' }];
    }
  })();

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {primary.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors
                ${isActive ? 'text-blue-600' : 'text-slate-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className="leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors
              ${showMore ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <div className={`p-1 rounded-xl ${showMore ? 'bg-blue-50' : ''}`}>
              <MoreHorizontal size={20} strokeWidth={1.8} />
            </div>
            <span className="leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden transition-transform duration-300 ease-out
          ${showMore ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <div className="font-semibold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-400">{user?.role?.replace(/_/g, ' ')}</div>
          </div>
          <button
            onClick={() => setShowMore(false)}
            className="p-2 rounded-xl bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grid of links */}
        <div className="grid grid-cols-4 gap-1 px-3 pb-3">
          {moreLinks.map(({ to, icon: Icon, label }) => (
            <button
              key={to}
              onClick={() => handleMoreLink(to)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Icon size={22} className="text-slate-600" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium text-slate-600 leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-500 font-medium text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

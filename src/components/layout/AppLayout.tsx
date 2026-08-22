import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { TopBar } from './TopBar';
import { ProfileCompletionBanner } from '@/components/common/ProfileCompletionBanner';
import { NotificationPermissionBanner } from '@/components/common/NotificationPermissionBanner';
import { NotificationBell } from '@/features/notifications/NotificationPanel';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function AppLayout() {
  usePushNotifications();
  const location = useLocation();

  return (
    <div className="flex h-full min-h-dvh bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        {/* TopBar (with its own bell) is mobile-only — Sidebar has no header
            row of its own, so desktop needs this to see notifications at all. */}
        <div className="hidden lg:flex justify-end items-center px-6 py-3 border-b border-slate-100 bg-white">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <NotificationPermissionBanner />
          <ProfileCompletionBanner />
          {/* Keyed on the path so the entrance animation re-runs each navigation */}
          <div key={location.pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

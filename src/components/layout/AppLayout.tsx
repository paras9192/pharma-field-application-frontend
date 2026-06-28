import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/Sidebar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { TopBar } from './TopBar';
import { ProfileCompletionBanner } from '@/components/common/ProfileCompletionBanner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function AppLayout() {
  usePushNotifications();
  const location = useLocation();

  return (
    <div className="flex h-full min-h-dvh bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
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

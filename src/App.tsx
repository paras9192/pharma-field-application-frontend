import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, AdminRoute, GuestRoute } from '@/routes/ProtectedRoute';
import { Skeleton } from '@/components/feedback/Skeleton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const PageLoader = () => (
  <div className="p-6 space-y-3">
    <Skeleton height="h-8" width="w-1/3" />
    <Skeleton height="h-4" width="w-2/3" />
    <div className="grid grid-cols-2 gap-3 mt-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} height="h-24" rounded="rounded-2xl" />)}
    </div>
  </div>
);

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'));
const DoctorsPage = lazy(() => import('@/features/doctors/DoctorsPage'));
const DoctorDetailPage = lazy(() => import('@/features/doctors/DoctorDetailPage'));
const DoctorFormPage = lazy(() => import('@/features/doctors/DoctorFormPage'));
const ChemistsPage = lazy(() => import('@/features/chemists/ChemistsPage'));
const ChemistDetailPage = lazy(() => import('@/features/chemists/ChemistDetailPage'));
const ChemistFormPage = lazy(() => import('@/features/chemists/ChemistFormPage'));
const VisitsPage = lazy(() => import('@/features/visits/VisitsPage'));
const VisitDetailPage = lazy(() => import('@/features/visits/VisitDetailPage'));
const VisitFormPage = lazy(() => import('@/features/visits/VisitFormPage'));
const DailyReportsPage = lazy(() => import('@/features/dailyReports/DailyReportsPage'));
const DailyReportDetailPage = lazy(() => import('@/features/dailyReports/DailyReportDetailPage'));
const DailyReportNewPage = lazy(() => import('@/features/dailyReports/DailyReportNewPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const UserDetailPage = lazy(() => import('@/features/users/UserDetailPage'));
const UserFormPage = lazy(() => import('@/features/users/UserFormPage'));
const TerritoriesPage = lazy(() => import('@/features/territories/TerritoriesPage'));
const SettingsPage = lazy(() => import('@/features/auth/SettingsPage'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/visits" element={<VisitsPage />} />
                <Route path="/visits/new" element={<VisitFormPage />} />
                <Route path="/visits/:id" element={<VisitDetailPage />} />
                <Route path="/visits/:id/edit" element={<VisitFormPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/doctors/new" element={<DoctorFormPage />} />
                <Route path="/doctors/:id" element={<DoctorDetailPage />} />
                <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />
                <Route path="/chemists" element={<ChemistsPage />} />
                <Route path="/chemists/new" element={<ChemistFormPage />} />
                <Route path="/chemists/:id" element={<ChemistDetailPage />} />
                <Route path="/chemists/:id/edit" element={<ChemistFormPage />} />
                <Route path="/daily-reports" element={<DailyReportsPage />} />
                <Route path="/daily-reports/new" element={<DailyReportNewPage />} />
                <Route path="/daily-reports/:id" element={<DailyReportDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/new" element={<UserFormPage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                  <Route path="/users/:id/edit" element={<UserFormPage />} />
                  <Route path="/territories" element={<TerritoriesPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px' },
          success: { duration: 3000 },
          error: { duration: 4000 },
        }}
      />
    </QueryClientProvider>
  );
}

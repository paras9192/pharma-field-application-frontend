import { Suspense } from 'react';
import { lazyWithRetry } from '@/pwa/lazyWithRetry';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, AdminRoute, NoBillsRoute, GuestRoute } from '@/routes/ProtectedRoute';
import { Skeleton } from '@/components/feedback/Skeleton';
import { InstallPrompt } from '@/components/common/InstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 30_000 },
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

const LoginPage = lazyWithRetry(() => import('@/features/auth/LoginPage'));
const SetPasswordPage = lazyWithRetry(() => import('@/features/auth/SetPasswordPage'));
const DashboardPage = lazyWithRetry(() => import('@/features/dashboard/DashboardPage'));
const AttendancePage = lazyWithRetry(() => import('@/features/attendance/AttendancePage'));
const DoctorsPage = lazyWithRetry(() => import('@/features/doctors/DoctorsPage'));
const DoctorDetailPage = lazyWithRetry(() => import('@/features/doctors/DoctorDetailPage'));
const DoctorFormPage = lazyWithRetry(() => import('@/features/doctors/DoctorFormPage'));
const ChemistsPage = lazyWithRetry(() => import('@/features/chemists/ChemistsPage'));
const ChemistDetailPage = lazyWithRetry(() => import('@/features/chemists/ChemistDetailPage'));
const ChemistFormPage = lazyWithRetry(() => import('@/features/chemists/ChemistFormPage'));
const VisitsPage = lazyWithRetry(() => import('@/features/visits/VisitsPage'));
const VisitDetailPage = lazyWithRetry(() => import('@/features/visits/VisitDetailPage'));
const VisitFormPage = lazyWithRetry(() => import('@/features/visits/VisitFormPage'));
const DailyReportsPage = lazyWithRetry(() => import('@/features/dailyReports/DailyReportsPage'));
const DailyReportDetailPage = lazyWithRetry(() => import('@/features/dailyReports/DailyReportDetailPage'));
const DailyReportNewPage = lazyWithRetry(() => import('@/features/dailyReports/DailyReportNewPage'));
const UsersPage = lazyWithRetry(() => import('@/features/users/UsersPage'));
const UserDetailPage = lazyWithRetry(() => import('@/features/users/UserDetailPage'));
const UserFormPage = lazyWithRetry(() => import('@/features/users/UserFormPage'));
const TerritoriesPage = lazyWithRetry(() => import('@/features/territories/TerritoriesPage'));
const ProductsPage = lazyWithRetry(() => import('@/features/products/ProductsPage'));
const ProductDetailPage = lazyWithRetry(() => import('@/features/products/ProductDetailPage'));
const ProductFormPage = lazyWithRetry(() => import('@/features/products/ProductFormPage'));
const SettingsPage = lazyWithRetry(() => import('@/features/auth/SettingsPage'));
// const OrdersPage = lazyWithRetry(() => import('@/features/orders/OrdersPage'));
// const OrderDetailPage = lazyWithRetry(() => import('@/features/orders/OrderDetailPage'));
// const OrderFormPage = lazyWithRetry(() => import('@/features/orders/OrderFormPage'));
const BillsPage = lazyWithRetry(() => import('@/features/bills/BillsPage'));
const BillDetailPage = lazyWithRetry(() => import('@/features/bills/BillDetailPage'));
const BillFormPage = lazyWithRetry(() => import('@/features/bills/BillFormPage'));
const PaymentsPage = lazyWithRetry(() => import('@/features/payments/PaymentsPage'));
const PaymentsDashboardPage = lazyWithRetry(() => import('@/features/dashboard/PaymentsDashboardPage'));
const WalletPage = lazyWithRetry(() => import('@/features/incentives/WalletPage'));
const WalletsAdminPage = lazyWithRetry(() => import('@/features/incentives/WalletsAdminPage'));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/set-password" element={<SetPasswordPage />} />

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
                {/* <Route path="/orders" element={<OrdersPage />} /> */}
                {/* <Route path="/orders/new" element={<OrderFormPage />} /> */}
                {/* <Route path="/orders/:id" element={<OrderDetailPage />} /> */}
                <Route element={<NoBillsRoute />}>
                  <Route path="/bills" element={<BillsPage />} />
                  <Route path="/bills/new" element={<BillFormPage />} />
                  <Route path="/bills/:id" element={<BillDetailPage />} />
                </Route>
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/dashboard/payments" element={<PaymentsDashboardPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/products/new" element={<ProductFormPage />} />
                  <Route path="/products/:id/edit" element={<ProductFormPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/new" element={<UserFormPage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                  <Route path="/users/:id/edit" element={<UserFormPage />} />
                  <Route path="/territories" element={<TerritoriesPage />} />
                  <Route path="/wallets" element={<WalletsAdminPage />} />
                  <Route path="/wallet/:userId" element={<WalletPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <InstallPrompt />
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

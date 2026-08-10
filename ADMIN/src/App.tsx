import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layout/AdminLayout';

const LoginPage = lazy(() => import('@/pages/login/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/users/UserDetailPage'));
const SkillsPage = lazy(() => import('@/pages/skills/SkillsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const WalletPage = lazy(() => import('@/pages/wallet/WalletPage'));
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'));
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);

  // Khôi phục phiên đăng nhập từ localStorage khi app khởi động
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return <Suspense fallback={
    <div className="flex min-h-screen items-center justify-center bg-surface-2 text-sm font-medium text-text-muted">
      <span className="mr-3 inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      Đang tải trang quản trị...
    </div>
  }>
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — AdminLayout kiểm tra auth */}
      <Route element={<AdminLayout />}>
        <Route path="/"             element={<DashboardPage />} />
        <Route path="/users"        element={<UsersPage />} />
        <Route path="/users/:id"    element={<UserDetailPage />} />
        <Route path="/skills"       element={<SkillsPage />} />
        <Route path="/reports"      element={<ReportsPage />} />
        <Route path="/wallet"       element={<WalletPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/community"    element={<CommunityPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{ duration: 4000 }} 
          containerStyle={{ top: 80, right: 20 }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

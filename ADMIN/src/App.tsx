import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layout/AdminLayout';

import LoginPage        from '@/pages/login/LoginPage';
import DashboardPage    from '@/pages/dashboard/DashboardPage';
import UsersPage        from '@/pages/users/UsersPage';
import SkillsPage       from '@/pages/skills/SkillsPage';
import ReportsPage      from '@/pages/reports/ReportsPage';
import DisputesPage     from '@/pages/disputes/DisputesPage';
import WalletPage       from '@/pages/wallet/WalletPage';
import AppointmentsPage from '@/pages/appointments/AppointmentsPage';
import CommunityPage    from '@/pages/community/CommunityPage';

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

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes — AdminLayout kiểm tra auth */}
      <Route element={<AdminLayout />}>
        <Route path="/"             element={<DashboardPage />} />
        <Route path="/users"        element={<UsersPage />} />
        <Route path="/skills"       element={<SkillsPage />} />
        <Route path="/reports"      element={<ReportsPage />} />
        <Route path="/disputes"     element={<DisputesPage />} />
        <Route path="/wallet"       element={<WalletPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/community"    element={<CommunityPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

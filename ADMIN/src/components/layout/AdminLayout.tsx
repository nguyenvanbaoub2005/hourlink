import { useCallback, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 rounded-full border-[3px] border-surface-3 border-t-primary animate-spin"
          style={{ animationDuration: '0.7s' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[var(--sidebar-width)]">
        <Header onMenuOpen={() => setIsSidebarOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

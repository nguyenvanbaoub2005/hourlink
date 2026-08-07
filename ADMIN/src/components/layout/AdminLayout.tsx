import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="spinner-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-content">
        <Header />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

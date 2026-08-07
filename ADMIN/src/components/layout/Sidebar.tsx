import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wrench, Flag, Scale,
  Wallet, CalendarDays, Users2, LogOut
} from 'lucide-react';
import LogoIcon from '@/components/ui/LogoIcon';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
];

const mainNavItems = [
  { label: 'Người dùng',    icon: Users,         to: '/users' },
  { label: 'Kỹ năng',       icon: Wrench,        to: '/skills' },
  { label: 'Báo cáo',       icon: Flag,          to: '/reports',   badge: true },
  { label: 'Tranh chấp',    icon: Scale,         to: '/disputes',  badge: true },
  { label: 'Ví Time Credit', icon: Wallet,       to: '/wallet' },
  { label: 'Lịch hẹn',      icon: CalendarDays,  to: '/appointments' },
  { label: 'Cộng đồng',     icon: Users2,        to: '/community' },
];

export default function Sidebar() {
  const { logout, email } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <LogoIcon size={18} color="#FFF" />
        </div>
        <span className="sidebar-logo-text">HourLink</span>
        <span className="sidebar-logo-badge">ADMIN</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Tổng quan</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="sidebar-item-icon" size={18} />
            {item.label}
          </NavLink>
        ))}

        <p className="sidebar-section-label" style={{ marginTop: 8 }}>Quản lý</p>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="sidebar-item-icon" size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: user info + logout */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8, padding: '0 4px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Đang đăng nhập</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginTop: 2, wordBreak: 'break-all' }}>
            {email}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

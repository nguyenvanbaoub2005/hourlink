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
  { label: 'Người dùng',     icon: Users,        to: '/users' },
  { label: 'Kỹ năng',        icon: Wrench,       to: '/skills' },
  { label: 'Báo cáo',        icon: Flag,         to: '/reports',      badge: true },
  { label: 'Tranh chấp',     icon: Scale,        to: '/disputes',     badge: true },
  { label: 'Ví Time Credit',  icon: Wallet,       to: '/wallet' },
  { label: 'Lịch hẹn',       icon: CalendarDays, to: '/appointments' },
  { label: 'Cộng đồng',      icon: Users2,       to: '/community' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2.5 px-5 py-[9px] text-[14px] font-medium',
    'transition-all duration-200 cursor-pointer whitespace-nowrap',
    'border-l-[3px]',
    isActive
      ? 'bg-primary/[0.12] text-primary border-primary'
      : 'text-text-muted hover:bg-black/[0.03] hover:text-text border-transparent',
  ].join(' ');

const sectionLabel = 'text-[11px] font-bold uppercase tracking-[0.05em] text-text-muted px-5 py-2.5 pb-1.5';

export default function Sidebar() {
  const { logout, email } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-[var(--sidebar-width)] h-screen fixed top-0 left-0 bg-surface border-r border-border flex flex-col z-[100] overflow-hidden transition-transform duration-200">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2.5 px-5 h-[var(--header-height)] border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#059669] to-primary flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.35)] shrink-0 text-white">
          <LogoIcon size={18} color="#FFF" />
        </div>
        <span className="text-[15px] font-bold text-text tracking-[-0.3px]">HourLink</span>
        <span className="ml-auto text-[9px] font-semibold bg-primary/[0.12] text-primary px-1.5 py-0.5 rounded">ADMIN</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className={sectionLabel}>Tổng quan</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end className={navLinkClass}>
            <item.icon className="w-[18px] shrink-0" size={18} />
            {item.label}
          </NavLink>
        ))}

        <p className={`${sectionLabel} mt-2`}>Quản lý</p>
        {mainNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            <item.icon className="w-[18px] shrink-0" size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 py-4 border-t border-border shrink-0 flex flex-col gap-3">
        <div className="px-1 flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#047857] to-primary flex items-center justify-center text-[14px] font-bold text-white shadow-sm shrink-0">
            {email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[14px] font-bold text-text">Quản trị viên</p>
            <p className="text-[12px] text-text-muted">Administrator</p>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-danger font-bold text-[13px] transition-all hover:bg-danger hover:text-white shadow-sm"
          onClick={handleLogout}
        >
          <LogOut size={16} strokeWidth={2.5} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

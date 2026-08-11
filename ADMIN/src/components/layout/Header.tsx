import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/users':        'Quản lý Người dùng',
  '/skills':       'Quản lý Kỹ năng',
  '/reports':      'Quản lý Báo cáo',
  '/wallet':       'Ví Time Credit',
  '/appointments': 'Quản lý Lịch hẹn',
  '/community':    'Quản lý Cộng đồng',
};

const resolvePageTitle = (pathname: string) => {
  if (/^\/users\/[^/]+$/.test(pathname)) return 'Chi tiết Người dùng';
  return PAGE_TITLES[pathname] ?? 'HourLink Admin';
};

interface HeaderProps {
  onMenuOpen: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const { pathname } = useLocation();
  const title = resolvePageTitle(pathname);

  return (
    <header className="sticky top-0 z-50 flex h-[var(--header-height)] items-center justify-between border-b border-border bg-surface px-4 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Mở menu quản trị"
          className="rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text lg:hidden"
        >
          <Menu size={21} />
        </button>
        <div className="truncate text-[16px] font-bold text-text sm:text-[17px]">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-[14px] font-bold text-text">Quản trị viên</div>
          <div className="text-[12px] text-text-muted">Administrator</div>
        </div>
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#047857] to-primary flex items-center justify-center text-[13px] font-semibold text-white cursor-pointer select-none">
          A
        </div>
      </div>
    </header>
  );
}

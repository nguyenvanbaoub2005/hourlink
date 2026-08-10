import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/users':        'Quản lý Người dùng',
  '/skills':       'Quản lý Kỹ năng',
  '/reports':      'Quản lý Báo cáo',
  '/wallet':       'Ví Time Credit',
  '/appointments': 'Quản lý Lịch hẹn',
  '/community':    'Quản lý Cộng đồng',
};

export default function Header() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'HourLink Admin';

  return (
    <header className="h-[var(--header-height)] bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="text-[17px] font-bold text-text">{title}</div>
      <div className="flex items-center gap-3">
        <div className="text-right">
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

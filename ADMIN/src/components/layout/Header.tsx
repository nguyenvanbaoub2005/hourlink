import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/users':        'Quản lý Người dùng',
  '/skills':       'Quản lý Kỹ năng',
  '/reports':      'Quản lý Báo cáo',
  '/disputes':     'Quản lý Tranh chấp',
  '/wallet':       'Ví Time Credit',
  '/appointments': 'Quản lý Lịch hẹn',
  '/community':    'Quản lý Cộng đồng',
};

export default function Header() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'HourLink Admin';

  return (
    <header className="admin-header">
      <div>
        <div className="header-title">{title}</div>
      </div>
      <div className="header-right">
        <div className="header-admin-info">
          <div className="header-admin-name">Quản trị viên</div>
          <div className="header-admin-role">Administrator</div>
        </div>
        <div className="header-avatar">A</div>
      </div>
    </header>
  );
}

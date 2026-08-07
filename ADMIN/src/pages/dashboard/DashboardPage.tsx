import { Users, CalendarDays, Wallet, Flag, Scale, UserX, Activity } from 'lucide-react';

// Placeholder Dashboard - sẽ kết nối API thực sau khi BE implement /admin/dashboard/stats
export default function DashboardPage() {
  const stats = [
    { label: 'Tổng người dùng',    value: '—', icon: Users,        color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Buổi hỗ trợ hôm nay', value: '—', icon: CalendarDays, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Time Credit lưu thông', value: '—', icon: Wallet,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Báo cáo chờ xử lý',  value: '—', icon: Flag,         color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    { label: 'Tranh chấp đang mở', value: '—', icon: Scale,        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Tài khoản bị khoá',  value: '—', icon: UserX,        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)'},
    { label: 'Người dùng online',  value: '—', icon: Activity,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống HourLink</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-top">
              <div>
                <p className="stat-card-label">{s.label}</p>
                <p className="stat-card-value" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
                <s.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder charts area */}
      <div className="charts-grid mt-6">
        <div className="chart-card">
          <div className="chart-title">Người dùng đăng ký theo tuần</div>
          <div className="spinner-center" style={{ minHeight: 180 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
              <p style={{ fontSize: 13 }}>Đang chờ kết nối API backend</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>GET /admin/dashboard/user-growth</p>
            </div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Kỹ năng phổ biến</div>
          <div className="spinner-center" style={{ minHeight: 180 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🥧</div>
              <p style={{ fontSize: 13 }}>Đang chờ kết nối API backend</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>GET /admin/dashboard/top-skills</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

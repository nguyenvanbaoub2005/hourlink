import { Users, CalendarDays, Wallet, Flag, UserX, Activity } from 'lucide-react';

// Placeholder Dashboard - sẽ kết nối API thực sau khi BE implement /admin/dashboard/stats
export default function DashboardPage() {
  const stats = [
    { label: 'Tổng người dùng',       value: '—', icon: Users,        color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Buổi hỗ trợ hôm nay',   value: '—', icon: CalendarDays, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Time Credit lưu thông',  value: '—', icon: Wallet,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    { label: 'Báo cáo chờ xử lý',     value: '—', icon: Flag,         color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
    { label: 'Tài khoản bị khoá',      value: '—', icon: UserX,        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    { label: 'Người dùng online',      value: '—', icon: Activity,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-text">Dashboard</h1>
          <p className="text-[13px] text-text-muted mt-0.5">Tổng quan hệ thống HourLink</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-[10px] p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] cursor-default"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted">{s.label}</p>
                <p className="text-[28px] font-bold leading-none mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div
                className="w-[42px] h-[42px] rounded-md flex items-center justify-center shrink-0"
                style={{ background: s.bg, color: s.color }}
              >
                <s.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder charts area */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 mt-6">
        <div className="bg-surface border border-border rounded-[10px] p-5">
          <div className="text-[14px] font-semibold text-text mb-4">Người dùng đăng ký theo tuần</div>
          <div className="flex items-center justify-center" style={{ minHeight: 180 }}>
            <div className="text-center text-text-muted">
              <div className="text-[28px] mb-2">📊</div>
              <p className="text-[13px]">Đang chờ kết nối API backend</p>
              <p className="text-[11px] mt-1">GET /admin/dashboard/user-growth</p>
            </div>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-[10px] p-5">
          <div className="text-[14px] font-semibold text-text mb-4">Kỹ năng phổ biến</div>
          <div className="flex items-center justify-center" style={{ minHeight: 180 }}>
            <div className="text-center text-text-muted">
              <div className="text-[28px] mb-2">🥧</div>
              <p className="text-[13px]">Đang chờ kết nối API backend</p>
              <p className="text-[11px] mt-1">GET /admin/dashboard/top-skills</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Flag,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardApi from '@/api/dashboard';

type Period = 'week' | 'month';

const numberFormat = new Intl.NumberFormat('vi-VN');
const creditFormat = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontSize: 12,
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week');
  const statsQuery = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: DashboardApi.getStats,
  });
  const userGrowthQuery = useQuery({
    queryKey: ['admin-dashboard-user-growth', period],
    queryFn: () => DashboardApi.getUserGrowth(period),
  });
  const appointmentQuery = useQuery({
    queryKey: ['admin-dashboard-appointment-stats', period],
    queryFn: () => DashboardApi.getAppointmentStats(period),
  });
  const topSkillsQuery = useQuery({
    queryKey: ['admin-dashboard-top-skills'],
    queryFn: DashboardApi.getTopSkills,
  });

  const isFetching = statsQuery.isFetching
    || userGrowthQuery.isFetching
    || appointmentQuery.isFetching
    || topSkillsQuery.isFetching;

  const refresh = async () => {
    const results = await Promise.all([
      statsQuery.refetch(),
      userGrowthQuery.refetch(),
      appointmentQuery.refetch(),
      topSkillsQuery.refetch(),
    ]);
    if (results.some((result) => result.isError)) {
      toast.error('Một số dữ liệu chưa thể cập nhật');
    } else {
      toast.success('Đã cập nhật Dashboard');
    }
  };

  const stats = statsQuery.data;
  const cards = [
    { label: 'Tổng người dùng', value: numberFormat.format(stats?.totalUsers ?? 0), icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Tài khoản hoạt động', value: numberFormat.format(stats?.activeUsers ?? 0), icon: UserRoundCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Tổng lịch hẹn', value: numberFormat.format(stats?.totalAppointments ?? 0), icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Lịch đang hoạt động', value: numberFormat.format(stats?.activeAppointments ?? 0), icon: CalendarCheck2, color: 'text-sky-600 bg-sky-50' },
    { label: 'Hoàn thành hôm nay', value: numberFormat.format(stats?.completedToday ?? 0), icon: CheckCircle2, color: 'text-teal-600 bg-teal-50' },
    { label: 'Time Credit lưu thông', value: creditFormat.format(stats?.totalTimeCredits ?? 0), icon: Wallet, color: 'text-amber-600 bg-amber-50' },
    { label: 'Báo cáo chờ xử lý', value: numberFormat.format(stats?.pendingReports ?? 0), icon: Flag, color: 'text-rose-600 bg-rose-50' },
    { label: 'Tài khoản bị khóa', value: numberFormat.format(stats?.lockedAccounts ?? 0), icon: ShieldCheck, color: 'text-slate-600 bg-slate-100' },
  ];

  const activityRate = stats && stats.totalUsers > 0
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;
  const activeAppointmentRate = stats && stats.totalAppointments > 0
    ? Math.round((stats.activeAppointments / stats.totalAppointments) * 1000) / 10
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Tình hình vận hành thực tế của hệ thống HourLink.</p>
          {stats?.generatedAt && (
            <p className="mt-1 text-xs text-text-dim">
              Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(stats.generatedAt))}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text shadow-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {statsQuery.isError && (
        <ErrorPanel message="Không thể tải số liệu tổng quan. Hãy kiểm tra Backend và quyền Admin." onRetry={() => statsQuery.refetch()} />
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-text-muted">{label}</p>
                {statsQuery.isLoading
                  ? <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-surface-3" />
                  : <p className="mt-2 text-2xl font-bold text-text">{statsQuery.isError ? '—' : value}</p>}
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon size={19} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Activity size={20} /></div>
          <div><p className="text-sm font-semibold text-text">Xu hướng vận hành</p><p className="text-xs text-text-muted">Theo dõi phát sinh trong 7 hoặc 30 ngày gần nhất.</p></div>
        </div>
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          {(['week', 'month'] as Period[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${period === item ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              {item === 'week' ? '7 ngày' : '30 ngày'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Người dùng đăng ký mới" subtitle={`Số tài khoản mới trong ${period === 'week' ? '7' : '30'} ngày`}>
          {userGrowthQuery.isLoading && <ChartSkeleton />}
          {userGrowthQuery.isError && <ChartError onRetry={() => userGrowthQuery.refetch()} />}
          {userGrowthQuery.data && (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={userGrowthQuery.data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs><linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval={period === 'month' ? 4 : 0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 600 }} />
                <Area type="monotone" dataKey="value" name="Người dùng mới" stroke="#10b981" strokeWidth={2.5} fill="url(#userGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Lịch hẹn theo ngày" subtitle="Tính theo ngày dự kiến diễn ra">
          {appointmentQuery.isLoading && <ChartSkeleton />}
          {appointmentQuery.isError && <ChartError onRetry={() => appointmentQuery.refetch()} />}
          {appointmentQuery.data && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={appointmentQuery.data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval={period === 'month' ? 4 : 0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 600 }} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" name="Lịch hẹn" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Top kỹ năng được đặt lịch" subtitle="5 kỹ năng có nhiều lịch hẹn không bị hủy nhất">
          {topSkillsQuery.isLoading && <ChartSkeleton />}
          {topSkillsQuery.isError && <ChartError onRetry={() => topSkillsQuery.refetch()} />}
          {topSkillsQuery.data?.length === 0 && <EmptyChart message="Chưa có lịch hẹn gắn với kỹ năng." />}
          {topSkillsQuery.data && topSkillsQuery.data.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topSkillsQuery.data} layout="vertical" margin={{ top: 8, right: 16, left: 18, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#1e293b', fontWeight: 600 }} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" name="Lịch hẹn" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-text">Chỉ số nhanh</h2>
          <p className="mt-1 text-xs text-text-muted">Tỷ lệ được tính từ dữ liệu hiện tại.</p>
          <div className="mt-5 space-y-5">
            <ProgressItem label="Tài khoản đang hoạt động" value={activityRate} color="bg-emerald-500" />
            <ProgressItem label="Lịch đang hoạt động / tổng lịch" value={activeAppointmentRate} color="bg-blue-500" />
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-xs font-medium text-text-muted">Việc cần chú ý</p>
              <p className="mt-2 text-sm font-semibold text-text">{numberFormat.format(stats?.pendingReports ?? 0)} báo cáo chờ xử lý</p>
              <p className="mt-1 text-xs text-text-muted">{numberFormat.format(stats?.lockedAccounts ?? 0)} tài khoản đang bị khóa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="text-base font-bold text-text">{title}</h2><p className="mt-1 text-xs text-text-muted">{subtitle}</p></div>{children}</section>;
}

function ChartSkeleton() {
  return <div className="flex h-[260px] items-end gap-3 px-4 pb-4">{[42, 68, 50, 82, 58, 74, 63].map((height, index) => <div key={`${height}-${index}`} className="flex-1 animate-pulse rounded-t-lg bg-surface-3" style={{ height: `${height}%` }} />)}</div>;
}

function ChartError({ onRetry }: { onRetry: () => void }) {
  return <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center"><p className="text-sm text-danger">Không thể tải dữ liệu biểu đồ.</p><button type="button" onClick={onRetry} className="rounded-lg bg-surface-2 px-3 py-2 text-xs font-semibold text-text hover:bg-surface-3">Thử lại</button></div>;
}

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-[260px] items-center justify-center text-center text-sm text-text-muted">{message}</div>;
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-red-700">{message}</p><button type="button" onClick={onRetry} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm">Thử lại</button></div>;
}

function ProgressItem({ label, value, color }: { label: string; value: number; color: string }) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  return <div><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-medium text-text-muted">{label}</span><span className="text-sm font-bold text-text">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-3"><div className={`h-full rounded-full ${color}`} style={{ width: `${safeValue}%` }} /></div></div>;
}

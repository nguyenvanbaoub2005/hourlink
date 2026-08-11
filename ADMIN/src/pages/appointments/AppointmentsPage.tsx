import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  Eye, RefreshCw, Search, ShieldAlert, Users, X, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  appointmentsApi,
  type AdminAppointment,
  type AppointmentStatus,
} from '@/api/appointments';

const STATUS: Record<AppointmentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  UPCOMING: { label: 'Sắp tới', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  IN_PROGRESS: { label: 'Đang diễn ra', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  COMPLETED: { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
  DISPUTED: { label: 'Tranh chấp', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  RESCHEDULED: { label: 'Đổi lịch', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));
const shortTime = (value: string) => value?.slice(0, 5);

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const item = STATUS[status];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

function EmptyRows({ message }: { message: string }) {
  return (
    <tr><td colSpan={7} className="py-14 text-center text-sm text-text-muted">{message}</td></tr>
  );
}

export default function AppointmentsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const size = 10;

  const listQuery = useQuery({
    queryKey: ['admin-appointments', page, search, status, dateFrom, dateTo],
    queryFn: () => appointmentsApi.getAppointments({ page, size, search, status, dateFrom, dateTo }),
  });
  const statsQuery = useQuery({ queryKey: ['admin-appointment-stats'], queryFn: appointmentsApi.getStats });
  const detailQuery = useQuery({
    queryKey: ['admin-appointment', selectedId],
    queryFn: () => appointmentsApi.getDetail(selectedId!),
    enabled: Boolean(selectedId),
  });

  const refresh = async () => {
    const results = await Promise.all([listQuery.refetch(), statsQuery.refetch()]);
    if (results.some((result) => result.isError)) {
      toast.error('Không thể cập nhật đầy đủ dữ liệu lịch hẹn');
      return;
    }
    toast.success('Đã cập nhật dữ liệu lịch hẹn');
  };
  const clearFilters = () => {
    setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(0);
  };
  const items = listQuery.data?.content ?? [];
  const stats = statsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Quản lý Lịch hẹn</h1>
          <p className="mt-1 text-sm text-text-muted">Theo dõi lịch, xác nhận hoàn thành và các trường hợp hủy hoặc tranh chấp.</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-2">
          <RefreshCw size={16} className={listQuery.isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: 'Tổng lịch hẹn', value: stats?.total ?? 0, icon: CalendarDays, color: 'text-primary bg-primary/10' },
          { label: 'Đang hoạt động', value: stats?.active ?? 0, icon: Clock3, color: 'text-blue-600 bg-blue-50' },
          { label: 'Hoàn thành', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Đã hủy', value: stats?.cancelled ?? 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Tranh chấp', value: stats?.disputed ?? 0, icon: ShieldAlert, color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-text">{value}</p><p className="mt-1 text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <label className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Tên lịch, người dùng, email, kỹ năng..." className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" />
          </label>
          <select value={status} onChange={(e) => { setStatus(e.target.value as AppointmentStatus | ''); setPage(0); }} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Từ ngày" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" title="Đến ngày" />
          <button onClick={clearFilters} className="rounded-xl px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2">Xóa lọc</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-muted"><tr>
              <th className="px-5 py-3">Lịch hẹn</th><th className="px-5 py-3">Người hỗ trợ</th>
              <th className="px-5 py-3">Người nhận</th><th className="px-5 py-3">Thời gian</th>
              <th className="px-5 py-3">Hình thức</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Chi tiết</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {listQuery.isLoading && <EmptyRows message="Đang tải lịch hẹn..." />}
              {listQuery.isError && <EmptyRows message="Không thể tải dữ liệu. Vui lòng kiểm tra Backend và thử lại." />}
              {!listQuery.isLoading && !listQuery.isError && items.length === 0 && <EmptyRows message="Không có lịch hẹn phù hợp." />}
              {items.map((item: AdminAppointment) => (
                <tr key={item.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-4"><p className="max-w-[240px] truncate font-semibold text-text">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.skillName ?? 'Không gắn kỹ năng'} · {item.timeCreditAmount} TC</p></td>
                  <td className="px-5 py-4"><p className="font-medium text-text">{item.providerName}</p><p className="text-xs text-text-muted">{item.providerEmail}</p></td>
                  <td className="px-5 py-4"><p className="font-medium text-text">{item.receiverName}</p><p className="text-xs text-text-muted">{item.receiverEmail}</p></td>
                  <td className="px-5 py-4"><p className="font-medium text-text">{formatDate(item.appointmentDate)}</p><p className="text-xs text-text-muted">{shortTime(item.startTime)}–{shortTime(item.endTime)}</p></td>
                  <td className="px-5 py-4 text-text-muted">{item.meetingType === 'ONLINE' ? 'Trực tuyến' : item.meetingType === 'OFFLINE' ? 'Trực tiếp' : 'Linh hoạt'}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 text-right"><button onClick={() => setSelectedId(item.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-semibold text-primary hover:bg-primary/10"><Eye size={15} /> Xem</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-text-muted">{listQuery.data?.totalElements ?? 0} lịch hẹn</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="min-w-24 text-center text-text-muted">Trang {page + 1}/{Math.max(listQuery.data?.totalPages ?? 1, 1)}</span>
            <button disabled={page + 1 >= (listQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {selectedId && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/40 backdrop-blur-sm" onMouseDown={() => setSelectedId(null)}>
          <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-5">
              <div><h2 className="text-xl font-bold text-text">Chi tiết lịch hẹn</h2><p className="text-xs text-text-muted">Mã: {selectedId}</p></div>
              <button onClick={() => setSelectedId(null)} className="rounded-lg p-2 hover:bg-surface-2"><X size={20} /></button>
            </div>
            {detailQuery.isLoading && <p className="p-8 text-center text-text-muted">Đang tải chi tiết...</p>}
            {detailQuery.isError && <p className="p-8 text-center text-danger">Không thể tải chi tiết lịch hẹn.</p>}
            {detailQuery.data && (() => {
              const detail = detailQuery.data;
              return <div className="space-y-6 p-6">
                <section><div className="mb-3 flex flex-wrap items-center gap-3"><h3 className="text-xl font-bold text-text">{detail.title}</h3><StatusBadge status={detail.status} /></div><p className="whitespace-pre-wrap text-sm leading-6 text-text-muted">{detail.description || 'Không có mô tả.'}</p></section>
                <section className="grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2">
                  <Info label="Thời gian" value={`${formatDate(detail.appointmentDate)}, ${shortTime(detail.startTime)}–${shortTime(detail.endTime)}`} />
                  <Info label="Time Credit" value={`${detail.timeCreditAmount} TC`} />
                  <Info label="Hình thức" value={detail.meetingType} />
                  <Info label="Địa điểm / link" value={detail.locationOrLink} />
                  <Info label="Kỹ năng" value={detail.skillName ?? 'Không có'} />
                  <Info label="Tạo lúc" value={formatDateTime(detail.createdAt)} />
                </section>
                <section className="grid gap-3 sm:grid-cols-2">
                  <Person title="Người hỗ trợ" name={detail.providerName} email={detail.providerEmail} />
                  <Person title="Người nhận hỗ trợ" name={detail.receiverName} email={detail.receiverEmail} />
                </section>
                {(detail.notes || detail.cancelReason || detail.rescheduleProposedTime) && <section className="rounded-2xl border border-border p-4"><h4 className="mb-3 font-bold text-text">Thông tin phản hồi</h4>{detail.notes && <Info label="Ghi chú" value={detail.notes} />}{detail.cancelReason && <Info label="Lý do hủy" value={detail.cancelReason} />}{detail.rescheduleProposedTime && <Info label="Đề xuất đổi lịch" value={detail.rescheduleProposedTime} />}</section>}
                <section><h4 className="mb-3 flex items-center gap-2 font-bold text-text"><Users size={18} /> Xác nhận hoàn thành ({detail.confirmations.length})</h4>
                  <div className="space-y-3">{detail.confirmations.length === 0 ? <p className="rounded-xl bg-surface-2 p-4 text-sm text-text-muted">Chưa có ai xác nhận hoàn thành.</p> : detail.confirmations.map((confirmation) => <div key={confirmation.id} className={`rounded-xl border p-4 ${confirmation.hasIssue ? 'border-orange-200 bg-orange-50' : 'border-border'}`}><div className="flex justify-between gap-3"><div><p className="font-semibold text-text">{confirmation.userName}</p><p className="text-xs text-text-muted">{confirmation.userEmail}</p></div><span className="text-xs text-text-muted">{formatDateTime(confirmation.confirmedAt)}</span></div><p className="mt-3 text-sm text-text">{confirmation.actualDurationMinutes} phút · {confirmation.contentCompleted || 'Không ghi nội dung'}</p>{confirmation.hasIssue && <p className="mt-2 text-sm font-medium text-orange-700">Vấn đề: {confirmation.issueDescription || 'Không mô tả'}</p>}</div>)}</div>
                </section>
              </div>;
            })()}
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-2 last:mb-0"><p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p><p className="mt-1 break-words text-sm font-medium text-text">{value}</p></div>;
}

function Person({ title, name, email }: { title: string; name: string; email: string }) {
  return <div className="rounded-2xl border border-border p-4"><p className="text-xs font-medium uppercase tracking-wide text-text-muted">{title}</p><p className="mt-2 font-semibold text-text">{name}</p><p className="text-sm text-text-muted">{email}</p></div>;
}
